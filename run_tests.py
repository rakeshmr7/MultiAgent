import os
import sys
import time
import socket
import subprocess
import shutil

def is_port_open(host, port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0

def wait_for_port(host, port, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        if is_port_open(host, port):
            return True
        time.sleep(0.5)
    return False

def main():
    print("==================================================")
    print("Multi-Agent Report App: Complete Test Suite Runner")
    print("==================================================")

    # 1. Ensure playwright is installed
    print("Installing Playwright browser binaries...")
    try:
        subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)
    except Exception as e:
        print(f"Warning: Playwright install command failed: {e}")

    # 2. Check if ports are already occupied
    if is_port_open('127.0.0.1', 8000):
        print("Error: Port 8000 is already occupied. Please close any running backend instances.")
        sys.exit(1)
    if is_port_open('127.0.0.1', 5173):
        print("Error: Port 5173 is already occupied. Please close any running frontend instances.")
        sys.exit(1)

    backend_proc = None
    frontend_proc = None

    backend_log = open("backend.log", "w")
    frontend_log = open("frontend.log", "w")

    try:
        # 3. Start Backend
        print("Starting FastAPI Backend (port 8000)...")
        backend_cmd = "uvicorn backend.app:app --port 8000" if os.name == 'nt' else ["uvicorn", "backend.app:app", "--port", "8000"]
        backend_proc = subprocess.Popen(
            backend_cmd,
            stdout=backend_log,
            stderr=backend_log,
            shell=True if os.name == 'nt' else False
        )
        
        # 4. Start Frontend
        print("Starting React Frontend (port 5173)...")
        frontend_cmd = "npm run dev -- --host 127.0.0.1" if os.name == 'nt' else ["npm", "run", "dev", "--", "--host", "127.0.0.1"]
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd="frontend",
            stdout=frontend_log,
            stderr=frontend_log,
            shell=True if os.name == 'nt' else False
        )

        # 5. Wait for ports
        print("Waiting for servers to start up...")
        backend_ready = wait_for_port('127.0.0.1', 8000, 30)
        frontend_ready = wait_for_port('127.0.0.1', 5173, 30)

        if not backend_ready:
            print("Error: Backend failed to start within timeout. Check backend.log")
            sys.exit(1)
        if not frontend_ready:
            print("Error: Frontend failed to start within timeout. Check frontend.log")
            sys.exit(1)

        print("Servers are ready. Running tests...")
        
        # 6. Run Backend Tests
        print("\n--- Running Backend Tests ---")
        backend_test_proc = subprocess.run(
            [sys.executable, "backend/test_graph.py"],
            capture_output=True,
            text=True
        )
        print(backend_test_proc.stdout)
        if backend_test_proc.returncode != 0:
            print("Backend tests failed with error output:")
            print(backend_test_proc.stderr)

        # 7. Run E2E Tests
        print("\n--- Running E2E Playwright Tests ---")
        e2e_test_proc = subprocess.run(
            [sys.executable, "-m", "pytest", "tests/test_e2e.py", "-v"],
            capture_output=True,
            text=True
        )
        print(e2e_test_proc.stdout)
        if e2e_test_proc.returncode != 0:
            print("E2E tests failed with error output:")
            print(e2e_test_proc.stderr)

        # 8. Create Consolidated Report
        print("\nConsolidating Test Reports...")
        consolidate_reports(backend_test_proc.returncode == 0, e2e_test_proc.stdout, e2e_test_proc.returncode == 0)

    finally:
        # Shutdown processes
        print("\nStopping background servers...")
        if backend_proc:
            if os.name == 'nt':
                # On Windows, taskkill is needed to clean up process groups spawned via shell=True
                subprocess.run(f"taskkill /F /T /PID {backend_proc.pid}", shell=True, capture_output=True)
            else:
                backend_proc.terminate()
                backend_proc.wait()
        if frontend_proc:
            if os.name == 'nt':
                subprocess.run(f"taskkill /F /T /PID {frontend_proc.pid}", shell=True, capture_output=True)
            else:
                frontend_proc.terminate()
                frontend_proc.wait()
        
        # Close log files
        backend_log.close()
        frontend_log.close()
        print("Servers stopped.")

def consolidate_reports(backend_success, e2e_stdout, e2e_success):
    report_title = "# Consolidated Test Report\n"
    timestamp = f"Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    
    summary = "## Test Summary\n"
    backend_status = "✅ PASSED" if backend_success else "❌ FAILED"
    e2e_status = "✅ PASSED" if e2e_success else "❌ FAILED"
    
    summary += f"- **Backend LangGraph Unit Tests**: {backend_status}\n"
    summary += f"- **Frontend & E2E Integration Tests**: {e2e_status}\n\n"
    
    backend_details = "## Backend Test Details\n"
    backend_details_path = "backend/test_results.md"
    if os.path.exists(backend_details_path):
        with open(backend_details_path, "r", encoding="utf-8") as f:
            # Skip the first title header from backend report to avoid double h1
            lines = f.readlines()
            backend_details += "".join(lines[1:])
    else:
        backend_details += "_No backend details found._\n"
        
    e2e_details = "\n## Frontend & E2E Test Details\n"
    e2e_details += f"```text\n{e2e_stdout}\n```\n"
    
    final_report = report_title + timestamp + summary + backend_details + e2e_details
    
    with open("test_results.md", "w", encoding="utf-8") as f:
        f.write(final_report)
        
    print(f"Consolidated test report generated at: {os.path.abspath('test_results.md')}")

if __name__ == "__main__":
    main()
