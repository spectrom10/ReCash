# ReCash

**A clearer view of the markets.** A prototype dashboard combining market snapshots, financial headlines, AI headline sentiment, and an educational AI chat.

[Open ReCash](https://recash.pages.dev) · [GitHub repository](https://github.com/spectrom10/ReCash)

## Final interface

![ReCash dashboard with markets on the left, financial news in the centre, and ReCash AI on the right](assets/recash-final-ui.png)

*Original final UI screenshot supplied on 29 October 2026, copied without modification. The screenshot shows a point in time, including a preview ticker and some stale market prices.*

## How everything connects

The browser loads the website from Cloudflare Pages. Market and news panels request data from a Google Apps Script Web App, backed by the **Market Ledger Database** in Google Sheets. AI chat takes a separate route through a Cloudflare Pages Function.

Arrows below label requests, data reads/writes, or responses; they do not imply that every source is contacted whenever someone opens the page.

```mermaid
flowchart TD
    Visitor["Visitor's browser"]
    Pages["Cloudflare Pages<br/>recash.pages.dev"]

    subgraph Frontend["Frontend files running in the browser"]
        UI["index.html + style.css<br/>Page structure and appearance"]
        ChatUI["script.js<br/>Page behaviour and AI chat"]
        MarketsUI["markets.js<br/>Market panel"]
        NewsUI["news.js<br/>News panel"]
    end

    subgraph Cloudflare["Cloudflare server-side chat"]
        Chat["Pages Function: /api/chat<br/>functions/api/chat.js"]
        KV["Cloudflare KV<br/>AI_LIMITS<br/>Basic shared usage counter"]
    end

    subgraph Google["Google data backend"]
        WebApp["Google Apps Script Web App<br/>action=markets / action=news"]
        Jobs["Apps Script<br/>Market and news update logic"]
        Sheets["Google Sheets<br/>Market Ledger Database"]
    end

    MarketSources["Market data sources<br/>CoinGecko · Twelve Data · Finnhub<br/>Unofficial Yahoo Finance chart endpoint for FTSE"]
    RSS["News RSS feeds<br/>BBC Business · CNBC<br/>MarketWatch · The Guardian"]
    Groq["Groq API<br/>Chat model: openai/gpt-oss-20b<br/>Also used for headline sentiment"]

    Visitor -->|"opens website"| Pages
    Pages -->|"serves static files"| UI
    UI --- ChatUI
    UI --- MarketsUI
    UI --- NewsUI
    ChatUI -->|"sends question"| Chat
    Chat <-->|"reads and updates count"| KV
    Chat -->|"requests chat completion"| Groq
    Groq -->|"answer via function"| Chat
    Chat -->|"returns answer"| ChatUI
    MarketsUI -->|"GET action=markets"| WebApp
    NewsUI -->|"GET action=news"| WebApp
    Sheets -->|"stored market and news data"| WebApp
    WebApp -->|"market response"| MarketsUI
    WebApp -->|"news response"| NewsUI
    Jobs -->|"requests market data"| MarketSources
    MarketSources -->|"market snapshots"| Jobs
    Jobs -->|"fetches headlines"| RSS
    RSS -->|"feed items"| Jobs
    Jobs -->|"requests headline sentiment"| Groq
    Groq -->|"sentiment results"| Jobs
    Jobs -->|"writes updated records"| Sheets
```

- **Frontend:** HTML creates the page, CSS styles it, and JavaScript fills the panels and handles interaction.
- **Data backend:** Apps Script collects source data, uses Groq for headline sentiment, and stores results in Sheets. Its Web App exposes the market and news data to the frontend.
- **AI chat backend:** `functions/api/chat.js` handles browser questions, uses the `AI_LIMITS` KV binding for the basic usage limit, and calls Groq. The browser should not contain the Groq API key.
- **Model name:** `openai/gpt-oss-20b` is accessed through Groq. It does not imply a separate OpenAI API connection. The headline-sentiment model is not specified here.

## Build and deployment workflow

This is a practical reconstruction of the build workflow from the conversation and supplied project details, rather than an exact commit-by-commit history. It includes the connections needed to understand and maintain the site.

```mermaid
flowchart TD
    A["1. Build the interface in VS Code<br/>index.html · style.css · script.js<br/>markets.js · news.js"]
    B["2. Set up Google Sheets<br/>Market Ledger Database"]
    C["3. Add Apps Script data update logic<br/>Market APIs + news RSS feeds<br/>Groq headline sentiment"]
    D["4. Deploy the Apps Script Web App<br/>Expose action=markets and action=news"]
    E["5. Connect the frontend<br/>markets.js and news.js use the Web App URL"]
    F["6. Add the AI chat function<br/>functions/api/chat.js<br/>Groq: openai/gpt-oss-20b"]
    G["7. Commit and push files to GitHub<br/>spectrom10/ReCash · main"]
    H["8. Connect Cloudflare Pages to GitHub<br/>Project: recash<br/>Static site; no build command in recorded logs"]
    I["9. Configure Cloudflare chat settings<br/>GROQ_API_KEY · CHAT_ENABLED<br/>KV binding: AI_LIMITS"]
    J["10. Deploy or redeploy<br/>Pages serves the frontend and deploys Functions<br/>recash.pages.dev"]
    K["11. Check the live website<br/>Market freshness · news · AI response<br/>Capture final UI screenshot"]

    A --> B --> C --> D --> E --> F --> G --> H --> I --> J --> K
    K -.->|"later code changes: edit, commit, push"| A
```

### What to keep connected

| Connection | Purpose |
| --- | --- |
| VS Code → GitHub `spectrom10/ReCash` | Save and version website source files. |
| GitHub `main` → Cloudflare Pages `recash` | Deploy committed website changes. |
| `markets.js` → Apps Script `action=markets` | Load the market panel. |
| `news.js` → Apps Script `action=news` | Load financial headlines and available sentiment. |
| Apps Script ↔ Google Sheets | Maintain and serve the Market Ledger Database. |
| Apps Script → market APIs and RSS feeds | Collect market data and headlines. |
| Apps Script → Groq | Analyse headline sentiment. |
| `script.js` → `/api/chat` → Groq | Send questions and display AI answers. |
| `/api/chat` ↔ Cloudflare KV `AI_LIMITS` | Track basic shared chat usage. |

Keep API credentials in the relevant server-side configuration, rather than in public frontend files or this README. After changing Cloudflare settings, redeploy as needed and check the live chat.

## Limits and prototype behaviour

- **Basic shared AI limit:** The conversation requested 20 ReCash AI questions per day across the site. The KV counter is basic protection: KV updates are not an atomic counter, and concurrent requests can exceed the intended limit. Do not describe it as a guaranteed strict cap. The exact reset boundary and counting behaviour depend on the deployed function. This chat limit does not establish a limit on separate Apps Script sentiment calls.
- **Market freshness:** Stored values can be delayed, stale, or unavailable because of refresh timing, provider limits, or source failures. A successful page load does not prove that prices are current. The final screenshot explicitly shows stale prices and a forex availability notice. No refresh interval or installed Apps Script trigger schedule is confirmed here.
- **Demo ticker:** The top forex strip says “Preview · Live prices not connected.” It is a placeholder and should not be presented as a live quote feed, even when the market panel contains stored currency values.
- **FTSE source:** The Yahoo Finance chart endpoint is unofficial; availability and behaviour can change.
- **AI output:** Chat is for financial education, and headline sentiment is informational. Neither establishes a live trading signal or an automated trade-execution connection.

## Free platforms, tools, and sources used

Recorded as free tools or free-access services in this project; provider quotas, account terms, and future pricing still apply. RSS publishers and data providers are included as sources.

- Visual Studio Code
- GitHub
- Cloudflare Pages
- Cloudflare Pages Functions
- Cloudflare KV
- Groq
- Google Sheets
- Google Apps Script
- CoinGecko
- Twelve Data
- Finnhub
- Yahoo Finance (unofficial chart endpoint)
- BBC Business RSS
- CNBC RSS
- MarketWatch RSS
- The Guardian RSS

## Using this README

Copy `README.md` and the `assets` folder together into the root of the ReCash repository. Keep `assets/recash-final-ui.png` at that relative path so the screenshot displays on GitHub. GitHub renders the Mermaid diagrams directly; no extra diagram service is part of the website.

---

*Documentation snapshot: 29 October 2026. Based on the supplied ReCash project details, the accessible conversation history, and the original UI screenshot. This describes the recorded architecture, not a fresh audit of the deployed repository or service configuration. Exact provider-to-instrument mappings and refresh schedules are intentionally left unspecified where unconfirmed.*
