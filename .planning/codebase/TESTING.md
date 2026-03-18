# Testing Patterns

**Analysis Date:** 2026-03-18

## Test Framework

**Runner:**
- Not configured - no testing framework detected
- Recommend: `pytest` for Python (industry standard)
- Alternative: `unittest` (Python standard library)

**Assertion Library:**
- Not configured

**Run Commands:**
```bash
pytest                 # Run all tests (once configured)
pytest -v              # Verbose output
pytest --cov           # Coverage report
pytest -x              # Stop on first failure
```

## Test File Organization

**Location:**
- No test files present
- Recommend: Co-locate with source or use `tests/` directory
- Pattern: Either `test_hello.py` next to `hello.py` or `tests/test_hello.py`

**Naming:**
- Recommend: `test_*.py` or `*_test.py` prefix/suffix
- Function naming: `test_<description>` (e.g., `test_greeting_with_name`)

**Structure:**
```
hello-world/
├── hello.py          # Source
├── test_hello.py     # Tests (recommended location)
└── tests/
    └── test_hello.py # Alternative structure
```

## Test Structure

**Suite Organization:**
- Not established - recommend using `pytest` with classes or plain functions

**Recommended pattern:**
```python
import pytest
from hello import greet

def test_greet_with_name():
    """Test greeting with provided name."""
    result = greet("Alice")
    assert result == "Hello, Alice!"

def test_greet_empty_input():
    """Test greeting handles empty input."""
    result = greet("")
    assert result == "Hello, !"
```

**Patterns:**
- Use descriptive test names that explain what's being tested
- One assertion per test when possible
- Use fixtures for common setup

## Mocking

**Framework:**
- Not configured
- Recommend: `unittest.mock` (built-in) or `pytest-mock`

**Patterns:**
- Would mock `input()` to simulate user input without requiring interactive entry
- Example with pytest:
```python
def test_greeting_flow(monkeypatch):
    """Test greeting with mocked input."""
    monkeypatch.setattr('builtins.input', lambda _: 'Bob')
    # Call main function here
```

**What to Mock:**
- `input()` - always mock user input in tests
- Any external APIs or file I/O (not currently present)

**What NOT to Mock:**
- Built-in string operations
- `print()` - capture output with capsys fixture instead

## Fixtures and Factories

**Test Data:**
- Not established
- For expanded codebase, create fixtures for common names/inputs

**Location:**
- Recommend: `conftest.py` in tests directory for shared fixtures

## Coverage

**Requirements:**
- Not enforced - recommend 80%+ for critical paths
- Currently: 0% (no tests)

**View Coverage:**
```bash
pytest --cov=hello --cov-report=html
# Opens htmlcov/index.html
```

## Test Types

**Unit Tests:**
- To be created: test individual functions
- Example: test `greet()` function with various inputs
- Scope: Test logic in isolation, mock external dependencies

**Integration Tests:**
- Not needed for current simple script
- Would test greeting flow with actual input/output when expanded

**E2E Tests:**
- Not applicable for CLI script
- If building web interface, add with Selenium or Playwright

## Common Patterns

**Async Testing:**
- Not applicable (current code is synchronous)

**Error Testing:**
```python
def test_handles_eof_error():
    """Test graceful handling of EOF during input."""
    with pytest.raises(EOFError):
        # Simulate EOF condition
        pass
```

---

*Testing analysis: 2026-03-18*
