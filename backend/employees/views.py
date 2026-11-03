from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Sum, Count, Min, Max, StdDev
from django.http import HttpResponse
import csv
from decimal import Decimal

from .models import Employee, CURRENCY_RATES
from .serializers import EmployeeSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    """
    Full RESTful API Suite for ACME Salary Management:
    - GET    /api/employees/                     : List employees (pagination, search, filters)
    - POST   /api/employees/                     : Create employee record
    - GET    /api/employees/{id}/                : Retrieve employee details
    - PUT    /api/employees/{id}/                : Full update of employee & compensation
    - PATCH  /api/employees/{id}/                : Partial update
    - DELETE /api/employees/{id}/                : Remove employee record
    - GET    /api/employees/insights/            : Aggregate compensation intelligence
    - GET    /api/employees/departments/         : Departmental salary summary
    - GET    /api/employees/locations/           : Geographic distribution summary
    - GET    /api/employees/salary_distribution/ : Salary tier histogram
    - GET    /api/employees/export_csv/          : Export dataset to CSV
    - POST   /api/employees/bulk_adjust/         : Bulk merit increase across dept/location/org
    """
    queryset = Employee.objects.all().order_by('-id')
    serializer_class = EmployeeSerializer
    filterset_fields = ['department', 'location', 'gender', 'currency']
    search_fields = ['first_name', 'last_name', 'email', 'job_title']
    ordering_fields = ['salary_usd', 'hire_date', 'last_name', 'base_salary']

    @action(detail=False, methods=['get'])
    def insights(self, request):
        """Executive aggregate dashboard answering leadership compensation questions."""
        total_stats = Employee.objects.aggregate(
            headcount=Count('id'),
            total_spend=Sum('salary_usd'),
            avg_salary=Avg('salary_usd'),
            min_salary=Min('salary_usd'),
            max_salary=Max('salary_usd'),
            std_dev=StdDev('salary_usd')
        )

        dept_distribution = Employee.objects.values('department').annotate(
            headcount=Count('id'),
            avg_salary=Avg('salary_usd'),
            min_salary=Min('salary_usd'),
            max_salary=Max('salary_usd'),
            total_spend=Sum('salary_usd')
        ).order_by('-total_spend')

        loc_distribution = Employee.objects.values('location').annotate(
            headcount=Count('id'),
            avg_salary=Avg('salary_usd'),
            total_spend=Sum('salary_usd')
        ).order_by('-total_spend')

        gender_parity = Employee.objects.values('gender').annotate(
            headcount=Count('id'),
            avg_salary=Avg('salary_usd'),
            total_spend=Sum('salary_usd')
        )

        currency_breakdown = Employee.objects.values('currency').annotate(
            headcount=Count('id'),
            total_local_spend=Sum('base_salary')
        )

        return Response({
            'overview': total_stats,
            'by_department': list(dept_distribution),
            'by_location': list(loc_distribution),
            'gender_parity': list(gender_parity),
            'currency_breakdown': list(currency_breakdown)
        })

    @action(detail=False, methods=['get'])
    def departments(self, request):
        """List distinct departments with summary salary statistics."""
        stats = Employee.objects.values('department').annotate(
            headcount=Count('id'),
            avg_salary=Avg('salary_usd'),
            min_salary=Min('salary_usd'),
            max_salary=Max('salary_usd'),
            total_spend=Sum('salary_usd')
        ).order_by('department')
        return Response(list(stats))

    @action(detail=False, methods=['get'])
    def locations(self, request):
        """List distinct office locations with headcount and payroll spend."""
        stats = Employee.objects.values('location').annotate(
            headcount=Count('id'),
            avg_salary=Avg('salary_usd'),
            min_salary=Min('salary_usd'),
            max_salary=Max('salary_usd'),
            total_spend=Sum('salary_usd')
        ).order_by('location')
        return Response(list(stats))

    @action(detail=False, methods=['get'])
    def salary_distribution(self, request):
        """Salary tier histogram brackets."""
        brackets = [
            {'tier': '< $60,000', 'count': Employee.objects.filter(salary_usd__lt=60000).count()},
            {'tier': '$60,000 - $100,000', 'count': Employee.objects.filter(salary_usd__gte=60000, salary_usd__lt=100000).count()},
            {'tier': '$100,000 - $150,000', 'count': Employee.objects.filter(salary_usd__gte=100000, salary_usd__lt=150000).count()},
            {'tier': '$150,000 - $200,000', 'count': Employee.objects.filter(salary_usd__gte=150000, salary_usd__lt=200000).count()},
            {'tier': '> $200,000', 'count': Employee.objects.filter(salary_usd__gte=200000).count()},
        ]
        return Response(brackets)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Stream out salary dataset as a CSV spreadsheet export for HR audits."""
        queryset = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="acme_employee_salaries.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'ID', 'First Name', 'Last Name', 'Email', 'Department',
            'Job Title', 'Location', 'Gender', 'Hire Date',
            'Currency', 'Base Salary', 'Bonus', 'Salary USD'
        ])

        for emp in queryset.iterator(chunk_size=1000):
            writer.writerow([
                emp.id, emp.first_name, emp.last_name, emp.email,
                emp.department, emp.job_title, emp.location, emp.gender,
                emp.hire_date, emp.currency, emp.base_salary, emp.bonus, emp.salary_usd
            ])

        return response

    @action(detail=False, methods=['post'])
    def bulk_adjust(self, request):
        """
        Applies a percentage merit/cost-of-living salary increase across
        a targeted department, location, or company-wide.
        Payload: { "percentage": 5.0, "department": "Engineering", "location": "Berlin" }
        """
        percentage = request.data.get('percentage')
        if percentage is None:
            return Response({'error': 'percentage is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pct = Decimal(str(percentage)) / Decimal('100')
        except Exception:
            return Response({'error': 'Invalid percentage value'}, status=status.HTTP_400_BAD_REQUEST)

        qs = Employee.objects.all()
        dept = request.data.get('department')
        loc = request.data.get('location')

        if dept:
            qs = qs.filter(department=dept)
        if loc:
            qs = qs.filter(location=loc)

        count = 0
        updated_batch = []
        for emp in qs:
            emp.base_salary = round(emp.base_salary * (Decimal('1.0') + pct), 2)
            rate = CURRENCY_RATES.get(emp.currency, Decimal('1.00'))
            emp.salary_usd = round((emp.base_salary + emp.bonus) * rate, 2)
            updated_batch.append(emp)
            count += 1
            if len(updated_batch) >= 1000:
                Employee.objects.bulk_update(updated_batch, ['base_salary', 'salary_usd'])
                updated_batch = []

        if updated_batch:
            Employee.objects.bulk_update(updated_batch, ['base_salary', 'salary_usd'])

        return Response({
            'message': f'Successfully updated {count} employees with a {percentage}% adjustment.',
            'affected_count': count
        })
