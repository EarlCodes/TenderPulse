## Backend (Django REST API)

This backend provides APIs for the TenderLink SA frontend, including:

- **Tender feed** with filters and match scores
- **Tender detail**
- **Supplier profile** and **saved tenders**
- **Admin ingestion dashboard**, backed by the National Treasury OCDS API

### 1. Setup (without Docker)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # on Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Run migrations

```bash
cd backend
.venv\Scripts\activate
python manage.py migrate
```

### 3. Run the dev server

```bash
cd backend
.venv\Scripts\activate
python manage.py runserver 8000
```

The API will be available at `http://localhost:8000/api/`.

### 4. Key endpoints

- **GET** `/api/tenders/` – paginated tender feed, query params:
  - `search`, `categories`, `provinces`, `status`, `minValue`, `maxValue`
- **GET** `/api/tenders/<tender_id>/` – tender detail
- **GET/PUT** `/api/supplier/profile/` – get/update the default supplier profile
- **GET/POST/DELETE** `/api/supplier/saved-tenders/` – list/add/remove saved tenders
- **GET** `/api/admin/ingestion/stats/` – ingestion KPI stats
- **GET** `/api/admin/ingestion/errors/` – recent ingestion errors
- **POST** `/api/admin/ingestion/run/` – trigger one API ingestion page
- **POST** `/api/admin/ingestion/backfill/` – stub endpoint for bulk backfill

### 5. Environment variables (optional)

You can customise behaviour via env vars:

- `DJANGO_SECRET_KEY` – secret key (default is dev-only)
- `DJANGO_DEBUG` – `"true"` (default) or `"false"`
- `DJANGO_ALLOWED_HOSTS` – comma-separated list (default `"*"`)
- `FRONTEND_ORIGINS` – allowed CORS origins, e.g. `http://localhost:5173`

## Running with Docker & PostgreSQL

This project includes a `docker-compose.yml` that starts:

- PostgreSQL 16 (`db`)
- Django backend (`backend`)
- Vite frontend (`frontend`)

### 1. Create backend env file

From the `backend` folder, create a `.env` file (values must match `docker-compose.yml`):

```env
DJANGO_SECRET_KEY=dev-secret-change-me
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=*

POSTGRES_DB=tenderlink
POSTGRES_USER=tenderlink
POSTGRES_PASSWORD=tenderlink
POSTGRES_HOST=db
POSTGRES_PORT=5432

FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 2. Build and run the stack

From the project root (`tenderlink-sa`):

```bash
docker-compose up --build
```

Services:

- Backend API: `http://localhost:8000/api/`
- Frontend (Vite dev): `http://localhost:5173/`


