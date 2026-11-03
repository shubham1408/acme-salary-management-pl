from rest_framework import serializers
from .models import Employee

class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField(read_only=True)
    salary_usd = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email',
            'department', 'job_title', 'location', 'gender', 'hire_date',
            'currency', 'base_salary', 'bonus', 'salary_usd'
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
