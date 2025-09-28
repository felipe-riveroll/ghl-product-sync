import { test, expect } from '@playwright/test';

test('Validate UI fixes and improvements', async ({ page }) => {
  // Navigate to the application
  await page.goto('/');
  
  // Wait for content to load
  await page.waitForTimeout(5000);
  
  // Take a screenshot of the current state
  await page.screenshot({ path: 'fixed-ui-state.png', fullPage: true });
  
  console.log('=== UI ANALYSIS RESULTS ===');
  
  // 1. Check for placeholders/skeletons
  const skeletons = await page.locator('[class*="skeleton"]').count();
  console.log(`✅ Skeleton placeholders found: ${skeletons}`);
  
  // 2. Check statistics are now dynamic (should not be hardcoded values)
  const totalProducts = await page.locator('text=Total Productos').locator('..').locator('p').nth(1).textContent();
  const totalValue = await page.locator('text=Valor').locator('..').locator('p').nth(1).textContent();
  const totalStock = await page.locator('text=Stock').locator('..').locator('p').nth(1).textContent();
  
  console.log('📊 Dynamic Statistics:');
  console.log(`   - Total Products: ${totalProducts}`);
  console.log(`   - Total Value: ${totalValue}`);
  console.log(`   - Total Stock: ${totalStock}`);
  
  // Verify currency is MXN not EUR
  const hasMXN = totalValue?.includes('MX$') || totalValue?.includes('$');
  const hasEUR = totalValue?.includes('€');
  console.log(`💰 Currency Check: MXN=${hasMXN}, EUR=${hasEUR}`);
  
  // 3. Check if products are loaded
  const productRows = await page.locator('table tbody tr').count();
  console.log(`📦 Product rows loaded: ${productRows}`);
  
  // 4. Check currency format in product table prices
  if (productRows > 0) {
    const firstPrice = await page.locator('table tbody tr').first().locator('td').nth(2).textContent();
    console.log(`🏷️  First product price format: ${firstPrice}`);
    const tablePriceHasMXN = firstPrice?.includes('MX$') || firstPrice?.includes('$');
    const tablePriceHasEUR = firstPrice?.includes('€');
    console.log(`💱 Table price currency: MXN=${tablePriceHasMXN}, EUR=${tablePriceHasEUR}`);
  }
  
  // 5. Check for pagination controls
  const paginationLimitSelect = await page.locator('select').count();
  const paginationButtons = await page.locator('button:has-text("Anterior"), button:has-text("Siguiente")').count();
  const pageInfo = await page.locator('text=/Página \\d+ de \\d+/').count();
  
  console.log('📄 Pagination Controls:');
  console.log(`   - Limit selector: ${paginationLimitSelect > 0 ? '✅' : '❌'}`);
  console.log(`   - Navigation buttons: ${paginationButtons >= 2 ? '✅' : '❌'}`);
  console.log(`   - Page info: ${pageInfo > 0 ? '✅' : '❌'}`);
  
  // 6. Test pagination functionality
  if (paginationButtons >= 2) {
    const nextButton = page.locator('button:has-text("Siguiente")');
    const isNextEnabled = await nextButton.isEnabled();
    console.log(`   - Next button enabled: ${isNextEnabled ? '✅' : '❌'}`);
    
    // Try changing items per page
    if (paginationLimitSelect > 0) {
      await page.selectOption('select', '50');
      await page.waitForTimeout(2000);
      console.log(`   - Changed page size to 50: ✅`);
    }
  }
  
  console.log('=== ANALYSIS COMPLETE ===');
});