# MEDITRACK API

Production-grade FastAPI backend for MEDITRACK clinical patient management system.

## Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **Patient Management**: Full CRUD operations with pagination and filtering
- **Vitals Tracking**: Real-time vital signs monitoring and trend analysis
- **Medication Management**: Drug database with interaction checking
- **AI Analysis**: Grok AI-powered clinical analysis reports
- **AI Chat**: Streaming medical assistant chatbot
- **Dashboard Analytics**: KPI metrics and data aggregation

## Tech Stack

- **Framework**: FastAPI 0.115.0
- **Database**: PostgreSQL with async SQLAlchemy 2.0
- **Caching**: Redis
- **AI**: Grok AI (X.AI)
- **Authentication**: JWT with bcrypt
- **API Docs**: OpenAPI/Swagger (auto-generated)

## Quick Start

### 1. Install Dependencies

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.local` and update with your credentials:

```bash
cp .env.local .env
# Edit .env with your database URL, secret key, and API keys
```

### 3. Initialize Database

```bash
alembic upgrade head
python -m app.db.seed_data  # Load initial drug database
```

### 4. Run Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at `http://localhost:8000`

### 5. View API Docs

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token

### Patients
- `GET /api/v1/patients` - List patients (paginated)
- `POST /api/v1/patients` - Create patient
- `GET /api/v1/patients/{id}` - Get patient details
- `PATCH /api/v1/patients/{id}` - Update patient
- `DELETE /api/v1/patients/{id}` - Delete patient

### Vitals
- `POST /api/v1/vitals/patients/{id}/vitals` - Add vital reading
- `GET /api/v1/vitals/patients/{id}/vitals` - Get vitals history
- `GET /api/v1/vitals/patients/{id}/vitals/trends` - Get trend analysis

### AI Analysis
- `POST /api/v1/ai-analysis/generate` - Generate clinical report
- `GET /api/v1/ai-analysis/{report_id}` - Get report
- `GET /api/v1/ai-analysis/{report_id}/export/pdf` - Export as PDF

### Drug Checker
- `GET /api/v1/drugs/search?q={query}` - Search drugs
- `POST /api/v1/drugs/check-interactions` - Check interactions
- `GET /api/v1/drugs/fda-info/{drug_id}` - Get FDA info

### Chat
- `POST /api/v1/chat/send` - Send message (streaming)
- `GET /api/v1/chat/history` - Get chat history

### Dashboard
- `GET /api/v1/dashboard/stats` - Dashboard statistics
- `GET /api/v1/dashboard/kpis` - KPI metrics
- `GET /api/v1/dashboard/risk-distribution` - Risk distribution

## Development

### Run Tests

```bash
pytest
pytest --cov=app tests/  # With coverage
```

### Code Formatting

```bash
black app/
ruff check app/
mypy app/
```

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Production Deployment

### Docker

```bash
docker-compose up -d
```

### Environment Variables

Ensure all required environment variables are set:
- `SECRET_KEY` - Strong random key for JWT
- `DATABASE_URL` - PostgreSQL connection string
- `GROK_API_KEY` - X.AI API key
- `REDIS_URL` - Redis connection string

### Performance Tuning

```bash
# Run with Gunicorn + Uvicorn workers
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with 30-minute expiration
- CORS configured for whitelisted origins
- SQL injection prevention via parameterized queries
- Input validation with Pydantic
- Rate limiting per endpoint

## License

MIT License - See LICENSE file for details
