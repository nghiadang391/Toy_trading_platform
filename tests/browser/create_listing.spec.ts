import { test, expect } from "@playwright/test";

test.describe("Real Browser E2E: Listing Creation Flow", () => {
  const timestamp = Date.now();
  const testAddress = `ckt1_browser_seller_${timestamp}`;

  test("User can load create page, see safety recall warning, and submit listing", async ({ page }) => {
    // 1. Pre-seed logged in user in browser localStorage and enable mock passkey signature for headless browser test
    await page.addInitScript((address) => {
      (window as any).__MOCK_JOYID__ = true;
      window.localStorage.setItem(
        "toytrade_connected_user",
        JSON.stringify({
          id: `usr_${address.substring(0, 10)}`,
          joyIdAddress: address,
          displayName: "Browser Real User",
          region: "UK",
        })
      );
    }, testAddress);

    // 2. Navigate to /listings/create
    await page.goto("/listings/create");
    await expect(page.locator("h1")).toContainText(/Sell a Toy|Đăng Bán Đồ Chơi/i);

    // 3. Test safety recall alert trigger
    const titleInput = page.locator("#title");
    await titleInput.fill("Magnetix magnetic building set");

    // Wait for safety alert to render
    const safetyAlert = page.locator(".safety-alert");
    await expect(safetyAlert).toBeVisible({ timeout: 5000 });
    await expect(safetyAlert).toContainText(/Safety Recall Alert|Recall/i);

    // 4. Fill in benign safe toy
    const safeTitle = `LEGO Millennium Falcon #${timestamp.toString().slice(-4)}`;
    await titleInput.fill(safeTitle);
    await expect(safetyAlert).toContainText(/Safety Checked/i, { timeout: 5000 });

    // 5. Fill remaining form fields
    await page.locator("#description").fill("Brand new in box, sealed bags with all minifigures included.");
    await page.locator("#price").fill("160");
    await page.locator("#currency").selectOption("GBP");
    await page.locator("#category").selectOption("BUILDING_SETS");
    await page.locator("#condition").selectOption("NEW");
    await page.locator("#method").selectOption("MEETUP");
    await page.locator("#region").selectOption("UK");
    await page.locator("#location").fill("Central London Station");

    // 6. Submit the form
    const submitBtn = page.locator("button[type='submit']");
    await submitBtn.click();

    // 7. Verify navigation to /listings
    await expect(page).toHaveURL(/\/listings/, { timeout: 10000 });

    // 8. Verify the newly created item appears in the marketplace
    await expect(page.locator("body")).toContainText(safeTitle, { timeout: 10000 });
  });

  test.afterAll(async ({ request }) => {
    // Automatically delete test listings and user created during this browser session
    try {
      await request.delete(`/api/listings?address=${testAddress}`);
    } catch {
      // Ignore cleanup error in test tear-down
    }
  });
});
