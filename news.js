
const NEWS_API_URL = "https://script.google.com/macros/s/AKfycbzNF7PnU4EnOZl0R12o4JaAFrAWt2IuN5XURDqhZaEUpSJn46SHGoGi1jN8-SvgQquGOw/exec";

async function loadNews() {
  const newsFeed = document.querySelector("#news-feed");
  const newsStatus = document.querySelector("#news .data-status");

  if (!newsFeed || !newsStatus) {
    console.error("News elements not found.");
    return;
  }

  newsStatus.textContent = "Loading financial news…";

  try {
    const url = new URL(NEWS_API_URL);
    url.searchParams.set("action", "news");

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !Array.isArray(result.data?.articles)) {
      throw new Error("Unexpected news API response.");
    }

    const articles = result.data.articles.filter(
      (article) =>
        article.title &&
        article.url &&
        article.relevance === "Relevant"
    );

    newsFeed.replaceChildren();

    if (articles.length === 0) {
      newsStatus.textContent = "No financial news available.";
      return;
    }

    for (const [index, article] of articles.entries()) {
      const card = document.createElement("article");
      card.className = "article";

      const sentiment = String(
        article.sentiment || "neutral"
      ).toLowerCase();

      if (sentiment === "bullish") {
        card.classList.add("article--up");
      } else if (sentiment === "bearish") {
        card.classList.add("article--down");
      }

      if (index === 0) {
        card.classList.add("article--featured");
      }

      const meta = document.createElement("p");
      meta.className = "article-meta";

      const published = new Date(article.publishedAt);
      const dateLabel = Number.isNaN(published.getTime())
        ? ""
        : published.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
          });

      meta.textContent = [
        article.source,
        dateLabel
      ].filter(Boolean).join(" · ");

      const heading = document.createElement("h3");
      const link = document.createElement("a");

      const articleUrl = new URL(article.url);

      if (!["http:", "https:"].includes(articleUrl.protocol)) {
        continue;
      }

      link.href = articleUrl.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = article.title;

      heading.append(link);
      card.append(meta, heading);

      if (article.impact) {
        const impact = document.createElement("p");
        impact.className = "article-impact";
        impact.textContent = article.impact;
        card.append(impact);
      }

      newsFeed.append(card);
    }

    newsStatus.textContent =
      `Showing ${newsFeed.children.length} financial articles · AI sentiment is informational`;
  } catch (error) {
    console.error("Unable to load news:", error);
    newsStatus.textContent =
      "Financial news is temporarily unavailable.";
  }
}

loadNews();
