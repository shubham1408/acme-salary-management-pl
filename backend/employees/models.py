from django.db import models
from decimal import Decimal

CURRENCY_RATES = {
    'USD': Decimal('1.00'),
    'EUR': Decimal('1.08'),
    'GBP': Decimal('1.27'),
    'INR': Decimal('0.012'),
    'CAD': Decimal('0.74'),
    'SGD': Decimal('0.75'),
}

class Employee(models.Model):
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]

    first_name = models.CharField(max_length=64)
    last_name = models.CharField(max_length=64)
    email = models.EmailField(unique=True)
    department = models.CharField(max_length=64, db_index=True)
    job_title = models.CharField(max_length=100, db_index=True)
    location = models.CharField(max_length=64, db_index=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    hire_date = models.DateField()

    currency = models.CharField(max_length=3, default='USD')
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    bonus = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    salary_usd = models.DecimalField(max_digits=12, decimal_places=2, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['department', 'location']),
            models.Index(fields=['salary_usd']),
        ]

    def save(self, *args, **kwargs):
        rate = CURRENCY_RATES.get(self.currency, Decimal('1.00'))
        total_comp = Decimal(self.base_salary) + Decimal(self.bonus)
        self.salary_usd = round(total_comp * rate, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.job_title})"
