import { runAllScrapers } from "../src/lib/scraper/runner";

const targetId = process.argv[2];

runAllScrapers(targetId).catch((err) => {
  console.error(err);
  process.exit(1);
});
