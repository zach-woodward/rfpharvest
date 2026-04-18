import cron from "node-cron";
import { runAllScrapers } from "../src/lib/scraper/runner";
import { runDailyDigest } from "./daily-digest";

const TZ = process.env.CRON_TZ || "America/New_York";

const SCRAPE_SCHEDULE = process.env.CRON_SCRAPE || "0 */6 * * *"; // every 6 hours
const DIGEST_SCHEDULE = process.env.CRON_DIGEST || "0 7 * * *"; // 7am ET

function timestamp() {
  return new Date().toISOString();
}

async function safeRun(label: string, fn: () => Promise<unknown>) {
  console.log(`[scheduler] ${timestamp()} starting ${label}`);
  try {
    await fn();
    console.log(`[scheduler] ${timestamp()} finished ${label}`);
  } catch (err) {
    console.error(`[scheduler] ${timestamp()} ${label} FAILED:`, err);
  }
}

cron.schedule(
  SCRAPE_SCHEDULE,
  () => {
    void safeRun("scrape", () => runAllScrapers());
  },
  { timezone: TZ }
);

cron.schedule(
  DIGEST_SCHEDULE,
  () => {
    void safeRun("daily-digest", () => runDailyDigest());
  },
  { timezone: TZ }
);

console.log(`[scheduler] booted. scrape=${SCRAPE_SCHEDULE} digest=${DIGEST_SCHEDULE} tz=${TZ}`);

if (process.env.RUN_ON_BOOT === "1") {
  void safeRun("scrape (boot)", () => runAllScrapers());
}
