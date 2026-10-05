import { chromium } from "/Users/lacy/repo/coderev-wt-shipkit-sync/node_modules/playwright/index.mjs";
import fs from "node:fs";
const [base, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const routes = ["/", "/about", "/browse", "/popular", "/travel-guide", "/dolphins", "/pricing", "/features", "/faq", "/docs", "/blog", "/changelog", "/contact", "/sign-in", "/sign-up", "/waitlist", "/privacy-policy", "/terms-of-service"];
const browser = await chromium.launch();
for (const scheme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: scheme });
  await ctx.addInitScript((s) => { try { localStorage.setItem("theme", s); } catch {} }, scheme);
  await ctx.addCookies([{ name: "theme", value: scheme, url: base }]);
  const page = await ctx.newPage();
  for (const r of routes) {
    const name = (r === "/" ? "home" : r.slice(1).replace(/\//g, "_")) + "-" + scheme;
    try {
      const resp = await page.goto(`${base}${r}`, { waitUntil: "load", timeout: 45000 });
      await page.waitForTimeout(3500);
      await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
      console.log(name, resp?.status());
    } catch (e) { console.log(name, "ERR", e.message.slice(0, 80)); }
  }
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
  await m.addInitScript((s) => { try { localStorage.setItem("theme", s); } catch {} }, scheme);
  const mp = await m.newPage();
  await mp.goto(`${base}/`, { waitUntil: "load" });
  await mp.waitForTimeout(3500);
  await mp.screenshot({ path: `${out}/home-mobile-${scheme}.png`, fullPage: true });
  await m.close();
  await ctx.close();
}
await browser.close();
