# Consolidated Test Report
Generated on: 2026-07-03 16:10:52

## Test Summary
- **Backend LangGraph Unit Tests**: ✅ PASSED
- **Frontend & E2E Integration Tests**: ✅ PASSED

## Backend Test Details

Generated on: 2026-07-03 16:10:33

## Summary
- **Total Tests Run**: 2
- **Passed**: 2
- **Failed**: 0
- **Success Rate**: 100.0%

## Test Cases Detailed Report

| Topic | Expected Behavior | Actual Status | Time Elapsed | Passed? | Details |
|:---|:---|:---|:---|:---|:---|
| Future of Agentic AI | Generate report | completed | 0.01s | ✅ Yes | Notes: Yes, Draft: Yes, Final: Yes |
| Classic Lasagna Recipe | Reject domain | failed | 0.0s | ✅ Yes | Errors: `['Topic is outside the Technology Market Research domain. We only support tech companies, AI trends, cloud computing, cybersecurity, software engineering, or emerging technologies.']` |

## Frontend & E2E Test Details
```text
============================= test session starts =============================
platform win32 -- Python 3.12.3, pytest-9.1.1, pluggy-1.5.0 -- C:\Users\rakes\AppData\Local\Programs\Python\Python312\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\rakes\Documents\Hexaware\My Work Hexaware\GenAI\MultiAgent
plugins: anyio-4.14.1, langsmith-0.9.5, asyncio-1.4.0, base-url-2.1.0, playwright-0.8.0
asyncio: mode=Mode.STRICT, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collecting ... collected 4 items

tests/test_e2e.py::test_frontend_home_page PASSED                        [ 25%]
tests/test_e2e.py::test_dark_mode_toggle PASSED                          [ 50%]
tests/test_e2e.py::test_validation_rejection PASSED                      [ 75%]
tests/test_e2e.py::test_end_to_end_generation PASSED                     [100%]

============================= 4 passed in 16.16s ==============================

```
