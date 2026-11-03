# Product Requirements Document (PRD)
## ACME Org — Employee Salary Management System

### 1. Context & User Persona
- **Company**: ACME Org (10,000 distributed employees globally).
- **Target Persona**: HR Manager.
- **Problem Statement**: HR currently tracks compensation across disconnected spreadsheets across multiple countries. This creates version errors, currency mismatches, and prevents immediate answers to strategic compensation and pay equity questions.

### 2. Standard Enterprise Database (PostgreSQL)
- **Primary Database**: PostgreSQL 16 (production-grade relational database).
- **Driver**: `psycopg2-binary` with connection pooling support via `dj-database-url`.
- **Indexing**: B-Tree indexes on `(department, location)` and `salary_usd` to ensure fast search, aggregation, and filtering across 10,000+ records.

### 3. Complete REST API Suite
1. `GET /api/employees/` — Paginated directory with search (name, email, title), sorting, and multi-field filters (department, location, gender, currency).
2. `POST /api/employees/` — Create new employee with automatic multi-currency conversion to USD.
3. `GET /api/employees/<id>/` — Retrieve full employee profile.
4. `PUT /api/employees/<id>/` — Complete update of employee details and compensation.
5. `PATCH /api/employees/<id>/` — Partial update (adjust base salary, title, bonus).
6. `DELETE /api/employees/<id>/` — Delete an employee record.
7. `GET /api/employees/insights/` — Executive statistics: total headcount, payroll spend, min/max/average salary, standard deviation, departmental breakdown, geographic distribution, gender parity, and currency breakdown.
8. `GET /api/employees/departments/` — Aggregated headcount and payroll spend ranked by department.
9. `GET /api/employees/locations/` — Headcount and payroll distribution by global office.
10. `GET /api/employees/salary_distribution/` — Salary tier histogram distribution (<$60k, $60k-$100k, $100k-$150k, $150k-$200k, >$200k).
11. `GET /api/employees/export_csv/` — Streamed CSV export of compensation data for audits and offline reporting.
12. `POST /api/employees/bulk_adjust/` — Bulk merit or cost-of-living salary increase (by percentage across company, department, or office).

### 4. Out of Scope & Rationale
- **Bank ACH / Wire Disbursement**: Out of scope because the platform is designed for compensation tracking, governance, and analytics.
- **Employee Self-Service**: Access is strictly scoped to HR Manager persona.
- **Real-Time Forex Streaming**: Multi-currency conversion uses normalized fixed benchmarks to prevent daily market swings from altering quarterly compensation reporting.
