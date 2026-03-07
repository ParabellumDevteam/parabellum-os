import Redis from "ioredis";
import Parser from "rss-parser";

const redis = new Redis("redis://127.0.0.1:6379");
const parser = new Parser();

const FEEDS = [
  "https://www.producthunt.com/feed",
  "https://techcrunch.com/feed/",
  "https://www.theverge.com/rss/index.xml"
];

const KEYWORDS = [
  "wearable",
  "fitness",
  "health",
  "biohacking",
  "habit",
  "habits",
  "discipline",
  "performance",
  "recovery",
  "sleep",
  "hrv",
  "strava",
  "token",
  "crypto",
  "reward",
  "rewards",
  "incentive",
  "ai coach",
  "ai fitness",
  "quantified self",
  "longevity",
  "kickstarter",
  "crowdfunding"
];

function textOf(item) {
  return [
    item?.title || "",
    item?.contentSnippet || "",
    item?.content || "",
    item?.summary || ""
  ].join(" ").toLowerCase();
}

function matchedKeywords(item) {
  const text = textOf(item);
  return KEYWORDS.filter(k => text.includes(k));
}

async function sendSignal(item, matches) {
  const payload = {
    kind: "market_signal",
    topic: item.title,
    source: item.link,
    signal: {
      title: item.title,
      url: item.link,
      matched: matches
    },
    createdAt: new Date().toISOString()
  };

  await redis.lpush("q:pin:signals", JSON.stringify(payload));
  console.log("SIGNAL SENT:", item.title, "| matches:", matches.join(", "));
}

async function scanFeeds() {
  for (const url of FEEDS) {
    try {
      const feed = await parser.parseURL(url);

      for (const item of feed.items.slice(0, 10)) {
        const matches = matchedKeywords(item);
        if (matches.length === 0) continue;
        await sendSignal(item, matches);
      }

    } catch (e) {
      console.log("FEED ERROR:", url);
    }
  }
}

async function loop() {
  console.log("PIN Opportunity Scanner online");

  while (true) {
    await scanFeeds();
    console.log("Next scan in 5 minutes");
    await new Promise(r => setTimeout(r, 300000));
  }
}

loop();
