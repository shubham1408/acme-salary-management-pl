from django.test import TestCase
from decimal import Decimal
from .models import Employee, CURRENCY_RATES

class EmployeeAPISuiteTest(TestCase):
    def setUp(self):
        self.emp_usd = Employee.objects.create(
            first_name="Jane",
            last_name="Doe",
            email="jane@example.com",
            department="Engineering",
            job_title="Senior Engineer",
            location="San Francisco",
            gender="F",
            hire_date="2022-01-15",
            currency="USD",
            base_salary=Decimal("150000.00"),
            bonus=Decimal("20000.00")
        )
        self.emp_eur = Employee.objects.create(
            first_name="Hans",
            last_name="Schmidt",
            email="hans@example.com",
            department="Product",
            job_title="Product Manager",
            location="Berlin",
            gender="M",
            hire_date="2023-03-01",
            currency="EUR",
            base_salary=Decimal("100000.00"),
            bonus=Decimal("5000.00")
        )

    def test_list_and_search_api(self):
        res = self.client.get('/api/employees/?search=Jane')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['count'], 1)

    def test_create_employee_api(self):
        payload = {
            "first_name": "Alice",
            "last_name": "Smith",
            "email": "alice@example.com",
            "department": "Sales",
            "job_title": "Account Executive",
            "location": "London",
            "gender": "F",
            "hire_date": "2024-01-01",
            "currency": "GBP",
            "base_salary": "70000.00",
            "bonus": "10000.00"
        }
        res = self.client.post('/api/employees/', payload, content_type='application/json')
        self.assertEqual(res.status_code, 201)
        created = Employee.objects.get(email="alice@example.com")
        self.assertEqual(created.currency, "GBP")
        expected_usd = round(Decimal("80000.00") * CURRENCY_RATES['GBP'], 2)
        self.assertEqual(created.salary_usd, expected_usd)

    def test_update_salary_api(self):
        res = self.client.patch(
            f'/api/employees/{self.emp_usd.id}/',
            {"base_salary": "160000.00"},
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 200)
        self.emp_usd.refresh_from_db()
        self.assertEqual(self.emp_usd.base_salary, Decimal("160000.00"))
        self.assertEqual(self.emp_usd.salary_usd, Decimal("180000.00"))

    def test_delete_employee_api(self):
        res = self.client.delete(f'/api/employees/{self.emp_usd.id}/')
        self.assertEqual(res.status_code, 204)
        self.assertFalse(Employee.objects.filter(id=self.emp_usd.id).exists())

    def test_insights_api(self):
        res = self.client.get('/api/employees/insights/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['overview']['headcount'], 2)
        self.assertIn('by_department', res.data)
        self.assertIn('by_location', res.data)

    def test_departments_and_locations_api(self):
        res_dept = self.client.get('/api/employees/departments/')
        self.assertEqual(res_dept.status_code, 200)
        self.assertEqual(len(res_dept.data), 2)

        res_loc = self.client.get('/api/employees/locations/')
        self.assertEqual(res_loc.status_code, 200)
        self.assertEqual(len(res_loc.data), 2)

    def test_salary_distribution_api(self):
        res = self.client.get('/api/employees/salary_distribution/')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.data) > 0)

    def test_export_csv_api(self):
        res = self.client.get('/api/employees/export_csv/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'text/csv')
        self.assertIn('Jane', res.content.decode('utf-8'))

    def test_bulk_adjust_api(self):
        res = self.client.post(
            '/api/employees/bulk_adjust/',
            {"percentage": 10.0, "department": "Engineering"},
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 200)
        self.emp_usd.refresh_from_db()
        self.assertEqual(self.emp_usd.base_salary, Decimal("165000.00"))
