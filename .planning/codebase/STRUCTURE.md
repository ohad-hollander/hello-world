# Codebase Structure

**Analysis Date:** 2026-03-18

## Directory Layout

```
hello-world/
├── hello.py           # Main application entry point
├── .git/              # Git repository metadata
├── .claude/           # Claude IDE configuration
├── .planning/         # Planning and documentation
│   └── codebase/      # Architecture documentation
└── README or docs     # Not present
```

## Directory Purposes

**Root Directory:**
- Purpose: Project root containing single executable script
- Contains: Python source files and configuration directories
- Key files: `hello.py`

**.planning/codebase:**
- Purpose: Architecture and structure documentation
- Contains: Markdown analysis documents
- Generated: Yes (by codebase analysis tools)

## Key File Locations

**Entry Points:**
- `hello.py`: Main application - prompts for user name and outputs greeting

**Configuration:**
- No application configuration files present

**Core Logic:**
- `hello.py`: All business logic (input prompt, string interpolation, output)

**Testing:**
- No test files present

## Naming Conventions

**Files:**
- `hello.py`: Lowercase with `.py` extension (standard Python convention)

**Directories:**
- Standard: Use lowercase with hyphens for multi-word names (`.planning`, `.claude`)
- Hidden: Prefix with `.` for configuration/system directories

## Where to Add New Code

**New Feature:**
- Primary code: `hello.py` (or create new `.py` file if separating concerns)
- Tests: Create `test_hello.py` or `tests/` directory with test files

**New Module/Utility:**
- Implementation: Create `[feature_name].py` in root or new `src/` directory
- Example: If adding name validation, create `name_validator.py` or `src/validators.py`

**Script Organization:**
If expanding beyond hello world, consider:
- `src/main.py` - Entry point
- `src/input_handler.py` - User interaction
- `src/formatter.py` - Output formatting
- `tests/` - Test files

## Special Directories

**.git:**
- Purpose: Git version control metadata
- Generated: Yes
- Committed: Yes

**.claude:**
- Purpose: Claude IDE workspace configuration
- Generated: Yes
- Committed: No (untracked)

**.planning:**
- Purpose: Project planning and documentation
- Generated: Yes
- Committed: No (under .gitignore typically)

---

*Structure analysis: 2026-03-18*
