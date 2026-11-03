from django.core.management.base import BaseCommand
from employees.models import Employee, CURRENCY_RATES
from faker import Faker
import random
from decimal import Decimal

fake = Faker()

DEPARTMENTS = ['Engineering', 'Product', 'Sales', 'Marketing', 'Customer Support', 'Finance', 'People & HR', 'Legal']
LOCATIONS = [
    ('San Francisco', 'USD', 95000, 240000),
    ('London', 'GBP', 60000, 150000),
    ('Berlin', 'EUR', 65000, 140000),
    ('Bengaluru', 'INR', 1200000, 4500000),
    ('Toronto', 'CAD', 80000, 180000),
    ('Singapore', 'SGD', 85000, 210000)
]
TITLES = {
    'Engineering': ['Software Engineer', 'Senior Engineer', 'Engineering Lead', 'QA Specialist'],
    'Product': ['Associate PM', 'Product Manager', 'Director of Product'],
    'Sales': ['SDR', 'Account Executive', 'Sales Director'],
    'Marketing': ['Content Specialist', 'Performance Marketer', 'Head of Growth'],
    'Customer Support': ['Support Agent', 'Support Team Lead'],
    'Finance': ['Financial Analyst', 'Senior Accountant'],
    'People & HR': ['HR Generalist', 'Recruiter', 'HRBP'],
    'Legal': ['Legal Counsel', 'Compliance Officer']
}

class Command(BaseCommand):
    help = 'Seeds 10,000 realistic employees into PostgreSQL across locations and departments'

    def handle(self, *args, **options):
        if Employee.objects.count() >= 10000:
            self.stdout.write(self.style.SUCCESS("Database already contains 10,000+ employees. Skipping seeding."))
            return

        self.stdout.write("Purging old records...")
        Employee.objects.all().delete()

        self.stdout.write("Generating 10,000 employees for PostgreSQL...")
        batch_size = 2000
        total_records = 10000
        employees = []

        for i in range(total_records):
            loc_data = random.choice(LOCATIONS)
            loc_city, currency, min_base, max_base = loc_data
            dept = random.choice(DEPARTMENTS)
            title = random.choice(TITLES[dept])
            base = round(Decimal(random.uniform(min_base, max_base)), 2)
            bonus = round(Decimal(random.uniform(0, float(base) * 0.25)), 2)
            
            rate = CURRENCY_RATES.get(currency, Decimal('1.00'))
            salary_usd = round((base + bonus) * rate, 2)
            
            gender = random.choices(['M', 'F', 'O'], weights=[48, 48, 4])[0]

            employees.append(Employee(
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                email=f"emp_{i}_{fake.unique.email()}",
                department=dept,
                job_title=title,
                location=loc_city,
                gender=gender,
                hire_date=fake.date_between(start_date='-7y', end_date='today'),
                currency=currency,
                base_salary=base,
                bonus=bonus,
                salary_usd=salary_usd
            ))

            if len(employees) >= batch_size:
                Employee.objects.bulk_create(employees)
                employees = []
                self.stdout.write(f"Persisted {i + 1}/{total_records} records into PostgreSQL...")

        if employees:
            Employee.objects.bulk_create(employees)

        self.stdout.write(self.style.SUCCESS("Successfully seeded 10,000 employees into PostgreSQL."))
