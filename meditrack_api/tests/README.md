# MediTrack API Test Suite

Comprehensive test suite for the MediTrack medical records API backend.

## Test Coverage

- **Authentication**: User registration, login, JWT tokens
- **Patients**: CRUD, pagination, search, filtering
- **Vitals**: Recording, trends, anomaly detection
- **Medications**: Management, validation, discontinuation
- **Drug Checker**: Search, interaction checking, FDA info
- **AI Analysis**: Report generation, retrieval, export
- **Dashboard**: KPIs, statistics, risk distribution
- **Utilities**: Medical calculations, validators

## Prerequisites

```bash
pip install -r requirements-dev.txt
```

## Running Tests

### All Tests
```bash
# Run all tests with verbose output
pytest -v

# Run with coverage report
pytest --cov=app --cov-report=html --cov-report=term

# Run tests in parallel (faster)
pytest -n auto
```

### Specific Test Files
```bash
# Single test file
pytest tests/test_auth.py -v

# Multiple files
pytest tests/test_patients.py tests/test_vitals.py -v
```

### Specific Tests
```bash
# Single test function
pytest tests/test_patients.py::TestPatientCreation::test_create_patient_with_all_fields -v

# All tests in a class
pytest tests/test_auth.py::TestUserRegistration -v
```

### By Test Markers
```bash
# Fast tests only
pytest -m "not slow" -v

# Integration tests
pytest -m integration -v
```

## Test Output

### Coverage Report
After running with `--cov`, open `htmlcov/index.html` in a browser for detailed coverage.

### Failed Tests
```bash
# Re-run only failed tests
pytest --lf -v

# Stop on first failure
pytest -x -v
```

## Configuration

Test settings are in `pyproject.toml`:
```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
python_files = "test_*.py"
```

## Fixtures

Key fixtures (defined in `conftest.py`):
- `db_session`: Test database with auto-rollback
- `test_client`: FastAPI test client
- `auth_headers`: Authenticated request headers
- `sample_patient`: Pre-created patient with data
- `sample_vitals`: 7 days of vital readings
- `sample_medications`: Active and inactive medications
- `sample_drugs`: Drug database entries
- `mock_grok_client`: Mocked AI client

## Writing New Tests

```python
async def test_my_feature(test_client, auth_headers, sample_patient):
    """Test description."""
    response = await test_client.get(
        f"/api/v1/endpoint/{sample_patient.id}",
        headers=auth_headers
    )
    assert response.status_code == 200
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: pytest --cov=app --cov-report=xml
```

## Troubleshooting

**AsyncIO Errors**: Ensure `asyncio_mode = "auto"` in config

**Database Errors**: Check that migrations are applied

**Import Errors**: Verify PYTHONPATH includes project root

## Test Statistics

- Total test files: 13
- Estimated test count: 150+
- Average execution time: <30 seconds
- Coverage target: >80%
