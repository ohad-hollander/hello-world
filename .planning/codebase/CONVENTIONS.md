# Coding Conventions

**Analysis Date:** 2026-03-18

## Naming Patterns

**Files:**
- Python files use lowercase with underscores: `hello.py`
- Currently minimal - only single file `hello.py`

**Functions:**
- No functions currently present in codebase

**Variables:**
- No custom variables beyond built-in `name` in hello.py

**Types:**
- Not applicable (no type hints present)

## Code Style

**Formatting:**
- No formatter configured (not detected)
- Current code uses Python standard style: lowercase letters, descriptive names
- Single statements per line

**Linting:**
- No linter configured (not detected)
- Recommend: `pylint`, `flake8`, or `ruff` for Python linting
- Recommend: Set up `.flake8` or `pyproject.toml` for style rules

## Import Organization

**Order:**
- Not applicable - no imports in current code

**Path Aliases:**
- Not applicable

## Error Handling

**Patterns:**
- No explicit error handling currently implemented in `hello.py`
- `input()` can raise `EOFError` if EOF reached - should be handled for robustness
- Recommend: Try-except blocks for user input with appropriate error messages

## Logging

**Framework:** console (built-in print())

**Patterns:**
- `print()` used for output in `hello.py` at line 2
- No structured logging framework present
- Recommend: Use `logging` module for production code, not `print()`

## Comments

**When to Comment:**
- Currently no comments in codebase
- For a small script like this, comments minimal, but docstrings recommended for any functions

**JSDoc/TSDoc:**
- Not applicable (Python project)
- Recommend: Use Python docstrings for function documentation

## Function Design

**Size:**
- Currently no functions in `hello.py`
- Module-level code: 2 lines is minimal and acceptable

**Parameters:**
- Not applicable

**Return Values:**
- Not applicable

## Module Design

**Exports:**
- Current module is not designed for reuse (module-level execution)
- If expanding, extract logic into functions for testability

**Barrel Files:**
- Not applicable for single-file project

---

*Convention analysis: 2026-03-18*
