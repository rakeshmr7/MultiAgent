import os
import sys
import time
import json
import pytest
from playwright.sync_api import sync_playwright

FRONTEND_URL = "http://localhost:5173"
BACKEND_URL = "http://localhost:8000"

def test_frontend_home_page():
    """Verify that the home page loads with the correct title and core panels."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            page.goto(FRONTEND_URL)
            page.wait_for_selector("text=Generate Tech Market Research Report", timeout=10000)
            
            # Check Title
            assert "Antigravity Multi-Agent Research Orchestrator" in page.title()
            
            # Check core inputs and buttons
            assert page.query_selector("input[placeholder*='e.g., Future of Agentic AI']") is not None
            assert page.query_selector("button:has-text('Generate Report')") is not None
            
            # Check that sample prompts are loaded
            assert page.query_selector("button:has-text('Agentic AI')") is not None
            
            print("E2E Test: Homepage loaded successfully.")
        finally:
            browser.close()

def test_dark_mode_toggle():
    """Verify that the dark/light mode toggle functions properly."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            page.goto(FRONTEND_URL)
            page.wait_for_selector("button[aria-label='Toggle theme']")
            
            # Toggle mode
            html_element = page.locator("html")
            
            # Check if initially dark (default)
            is_initially_dark = "dark" in html_element.evaluate("el => el.className")
            
            # Click toggle
            page.click("button[aria-label='Toggle theme']")
            time.sleep(0.5)
            
            is_dark_after_toggle = "dark" in html_element.evaluate("el => el.className")
            
            # They should be opposites
            assert is_initially_dark != is_dark_after_toggle
            print(f"E2E Test: Dark mode toggled successfully. Initial dark: {is_initially_dark}, current dark: {is_dark_after_toggle}")
        finally:
            browser.close()

def test_validation_rejection():
    """Verify that entering a non-technology query causes the validator to reject it."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            page.goto(FRONTEND_URL)
            page.wait_for_selector("button:has-text('Test Reject Domain')")
            
            # Click the lasagna chip
            page.click("button:has-text('Test Reject Domain')")
            
            # Click Generate
            page.click("button:has-text('Generate Report')")
            
            # Wait for rejection alert
            page.wait_for_selector("text=Topic Rejected / Execution Error", timeout=15000)
            
            # Verify failure message is visible
            alert_text = page.locator("text=Topic Rejected / Execution Error").is_visible()
            assert alert_text is True
            print("E2E Test: Domain validation rejected invalid query successfully.")
        finally:
            browser.close()

def test_end_to_end_generation():
    """Verify that running a technology topic generates a report successfully with logs."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            page.goto(FRONTEND_URL)
            page.wait_for_selector("button:has-text('Agentic AI')")
            
            # Click the "Agentic AI" prompt chip
            page.click("button:has-text('Agentic AI')")
            
            # Click Generate Report
            page.click("button:has-text('Generate Report')")
            
            # Wait for the workflow status to transition to researching and writing
            page.wait_for_selector("text=Researching", timeout=10000)
            
            # Wait for the report viewer to show up (indicates completed status)
            # The report viewer shows 'Market Research Report' heading
            page.wait_for_selector("text=Market Research Report", timeout=60000)
            
            # Check that markdown text is rendered inside the article
            prose_element = page.locator("article.prose")
            assert prose_element.count() > 0
            
            # Check that copying button and clear buttons are present
            assert page.locator("button:has-text('Copy Text')").is_visible()
            assert page.locator("button:has-text('Clear')").is_visible()
            
            # Click Clear and verify it resets
            page.click("button:has-text('Clear')")
            assert page.locator("article.prose").count() == 0
            
            print("E2E Test: End-to-end report generation and interface state reset verified.")
        finally:
            browser.close()
