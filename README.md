# ACME Salary Management System (Dockerized with PostgreSQL)

Full-stack enterprise salary management software designed for HR leadership overseeing 10,000 employees across multiple global offices.

## Architecture & Tech Stack
- **Database**: PostgreSQL 16 standard database container
- **Backend**: Python 3.11, Django 5, Django REST Framework, `psycopg2-binary`
- **Frontend**: React 18, Vite, Tailwind CSS
- **Orchestration**: Docker Compose with health checks for PostgreSQL readiness

---

## Complete API Surface

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/employees/` | Paginated directory with search & department/location filters |
| `POST` | `/api/employees/` | Add employee with automatic multi-currency conversion to USD |
| `GET` | `/api/employees/<id>/` | View individual employee profile |
| `PUT` | `/api/employees/<id>/` | Full update of employee details |
| `PATCH` | `/api/employees/<id>/` | Partial update (salary, bonus, title) |
| `DELETE` | `/api/employees/<id>/` | Remove employee record |
| `GET` | `/api/employees/insights/` | Executive aggregate compensation dashboard |
| `GET` | `/api/employees/departments/` | Departmental headcount & payroll spend |
| `GET` | `/api/employees/locations/` | Office-by-office geographic compensation |
| `GET` | `/api/employees/salary_distribution/` | Salary tier histogram distribution |
| `GET` | `/api/employees/export_csv/` | Direct CSV export of all filtered records |
| `POST` | `/api/employees/bulk_adjust/` | Bulk percentage raise across company, department, or office |

---

## Running with Docker (Recommended)

Start the entire system (PostgreSQL 16 Database + Django API + React Web Console + 10k Seeder) with one command:

```bash
docker compose up --build
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000/api/employees/](http://localhost:8000/api/employees/)
- **PostgreSQL**: Running on port `5432` (`postgres:postgres@localhost:5432/acme_salary_db`)

The startup sequence automatically:
1. Waits for PostgreSQL to become fully healthy.
2. Applies database migrations to PostgreSQL.
3. Seeds 10,000 realistic employees into PostgreSQL in seconds.
4. Boots the Django REST server and Vite frontend.

### Run Tests Inside Docker:
```bash
docker compose run --rm backend python manage.py test
```

### Stop Containers:
```bash
docker compose down
```

---

## Running Locally Without Docker

### 1. Prerequisites
Ensure you have PostgreSQL running locally, or supply your connection string via `DATABASE_URL`:
```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/acme_salary_db"
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations employee
python manage.py migrate
python manage.py seed_employees   # Generates 10,000 realistic employees in PostgreSQL
python manage.py test             # Runs test suite across all APIs
python manage.py runserver 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
