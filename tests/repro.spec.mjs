// @ts-check

import { test, expect } from "@playwright/test";

test("repro", async ({ page }) => {
  await page.goto("http://localhost:8080/guacamole");
  await page.getByRole("textbox", { name: "Username" }).fill("guac");
  await page.getByRole("textbox", { name: "Password" }).fill("guac");
  await page.getByRole("button", { name: "Login" }).click();

  let attempts = 0;
  let receivedAudio = false;
  do {
    attempts++;

    page.on("websocket", (ws) => {
      if (ws.url().includes("guacamole/websocket-tunnel")) {
        ws.on("framereceived", (event) => {
          if (typeof event.payload === "string") {
            if (event.payload.includes("5.audio")) {
              console.log(`[attempt ${attempts}] ${event.payload}`);
              receivedAudio = true;
            }
          }
        });
      }
    });

    await page.waitForTimeout(7 * 1000);

    if (receivedAudio) {
      // Try again
      receivedAudio = false;
      page.removeAllListeners("websocket");
      await page.reload();
    } else {
      // Hit the failure case
      console.log(
        `No audio detected on attempt ${attempts}, pausing for inspection for 1m`
      );
      await page.waitForTimeout(60 * 1000);
      return;
    }
  } while (!receivedAudio);
});
