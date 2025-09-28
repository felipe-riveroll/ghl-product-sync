import re
from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    This script verifies the main features of the GoHighLevel Products app.
    """
    # 1. Navigate to the app
    page.goto("http://localhost:8080/")

    # 2. Wait for the initial product list to load
    # We expect the product table to appear with at least one product.
    expect(page.locator("text=Gestión de Productos")).to_be_visible(timeout=60000)
    # Wait for at least one product row to be rendered
    expect(page.locator("tbody tr").first).to_be_visible(timeout=60000)
    print("✅ Initial products loaded.")

    # 3. Test search filter
    search_input = page.get_by_label("Buscar por nombre")
    search_input.fill("Aretes calavera")
    # Wait for the debounced search to trigger and update the list
    page.wait_for_timeout(1000) # Wait for debounce
    expect(page.locator("tbody tr").first).to_be_visible()
    # Check that all visible products match the search
    for row in page.locator("tbody tr").all():
        expect(row.get_by_text("Aretes calavera", exact=False)).to_be_visible()
    print("✅ Search filter works correctly.")
    search_input.clear()
    page.wait_for_timeout(1000) # Wait for debounce

    # 4. Test price filter
    min_price_input = page.get_by_placeholder("Min", exact=True)
    max_price_input = page.get_by_placeholder("Max", exact=True)
    min_price_input.fill("1")
    max_price_input.fill("2")
    page.wait_for_timeout(500)
    expect(page.locator("tbody tr").first).to_be_visible()
    for row in page.locator("tbody tr").all():
        price_text = row.locator('td:nth-child(3) span').inner_text()
        price = float(re.sub(r'[^\d.]', '', price_text))
        assert 1 <= price <= 2
    print("✅ Price filter works correctly.")
    min_price_input.clear()
    max_price_input.clear()
    page.wait_for_timeout(500)

    # 5. Test quantity filter
    min_quantity_input = page.locator('input[name="minQuantity"]')
    max_quantity_input = page.locator('input[name="maxQuantity"]')
    min_quantity_input.fill("5")
    max_quantity_input.fill("10")
    page.wait_for_timeout(500)
    expect(page.locator("tbody tr").first).to_be_visible()
    for row in page.locator("tbody tr").all():
        quantity_text = row.locator('td:nth-child(4) span').inner_text()
        quantity = int(re.search(r'\d+', quantity_text).group())
        assert 5 <= quantity <= 10
    print("✅ Quantity filter works correctly.")
    min_quantity_input.clear()
    max_quantity_input.clear()
    page.wait_for_timeout(500)

    # Reset limit to show more products for placeholder check
    page.get_by_label("Items por página").select_option("100")
    page.wait_for_timeout(1000)

    # 6. Verify image placeholder is present
    # This checks if at least one SVG placeholder is rendered
    placeholder = page.locator("svg.lucide-image-icon")
    expect(placeholder.first).to_be_visible()
    print("✅ Image placeholder is visible for products without an image.")

    # 7. Take a screenshot for final visual verification
    page.screenshot(path="jules-scratch/verification/verification.png")
    print("📸 Screenshot taken.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_verification(page)
        finally:
            browser.close()

if __name__ == "__main__":
    main()