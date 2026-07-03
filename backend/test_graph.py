import os
import sys
import time
import asyncio

# Ensure parent directory is in path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.graph import graph

async def run_test_case(topic: str, expect_success: bool):
    print(f"[{time.strftime('%H:%M:%S')}] Starting test case for: '{topic}'...")
    start_time = time.time()
    
    state = {
        "user_query": topic,
        "research_notes": None,
        "draft_report": None,
        "final_report": None,
        "status": "validating",
        "errors": None
    }
    
    # Run the graph asynchronously
    result = await graph.ainvoke(state)
    elapsed = time.time() - start_time
    
    status = result.get("status")
    success = (status == "completed") if expect_success else (status == "failed")
    
    print(f"[{time.strftime('%H:%M:%S')}] Completed in {elapsed:.2f}s with status: {status}")
    
    return {
        "topic": topic,
        "expected_success": expect_success,
        "success": success,
        "status": status,
        "errors": result.get("errors"),
        "elapsed_seconds": round(elapsed, 2),
        "has_notes": bool(result.get("research_notes")),
        "has_draft": bool(result.get("draft_report")),
        "has_final": bool(result.get("final_report")),
    }

async def main():
    print("==================================================")
    print("Starting LangGraph Multi-Agent Backend Tests")
    print("==================================================")

    test_cases = [
        {"topic": "Future of Agentic AI", "expect_success": True},
        {"topic": "Classic Lasagna Recipe", "expect_success": False},
    ]
    
    results = []
    for tc in test_cases:
        try:
            res = await run_test_case(tc["topic"], tc["expect_success"])
            results.append(res)
        except Exception as e:
            print(f"Execution failed with error: {str(e)}")
            results.append({
                "topic": tc["topic"],
                "expected_success": tc["expect_success"],
                "success": False,
                "status": "exception",
                "errors": [str(e)],
                "elapsed_seconds": 0.0,
                "has_notes": False,
                "has_draft": False,
                "has_final": False
            })
        print("-" * 50)
        
    # Write test_results.md
    report_path = os.path.join(os.path.dirname(__file__), "test_results.md")
    
    total_tests = len(results)
    passed_tests = sum(1 for r in results if r["success"])
    success_rate = (passed_tests / total_tests) * 100
    
    markdown_report = f"""# Backend LangGraph Test Results

Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}

## Summary
- **Total Tests Run**: {total_tests}
- **Passed**: {passed_tests}
- **Failed**: {total_tests - passed_tests}
- **Success Rate**: {success_rate}%

## Test Cases Detailed Report

| Topic | Expected Behavior | Actual Status | Time Elapsed | Passed? | Details |
|:---|:---|:---|:---|:---|:---|
"""
    for r in results:
        passed_str = "✅ Yes" if r["success"] else "❌ No"
        expected_behavior = "Generate report" if r["expected_success"] else "Reject domain"
        
        if r["status"] == "failed":
            details = f"Errors: `{r['errors']}`"
        elif r["status"] == "exception":
            details = f"Exception: `{r['errors']}`"
        else:
            details = f"Notes: {'Yes' if r['has_notes'] else 'No'}, Draft: {'Yes' if r['has_draft'] else 'No'}, Final: {'Yes' if r['has_final'] else 'No'}"
            
        markdown_report += f"| {r['topic']} | {expected_behavior} | {r['status']} | {r['elapsed_seconds']}s | {passed_str} | {details} |\n"
        
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(markdown_report)
        
    print(f"\nTest suite completed. Results generated at: {report_path}")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
