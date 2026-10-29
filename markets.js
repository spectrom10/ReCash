
const MARKET_API_URL = "https://script.google.com/macros/s/AKfycbzNF7PnU4EnOZl0R12o4JaAFrAWt2IuN5XURDqhZaEUpSJn46SHGoGi1jN8-SvgQquGOw/exec";

async function loadMarkets() {
  const status = document.querySelector("#market-status");
  const marketRows = document.querySelector("#market-rows");

  if (!status || !marketRows) {
    console.error("Market elements not found in HTML.");
    return;
  }

  status.textContent = "Loading market data…";

  try {
    const url = new URL(MARKET_API_URL);
    url.searchParams.set("action", "markets");

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !Array.isArray(result.data?.markets)) {
      throw new Error("Unexpected API response.");
    }

    marketRows.replaceChildren();

    for (const market of result.data.markets) {
      const row = document.createElement("tr");

      const symbol = document.createElement("th");
      symbol.scope = "row";
      symbol.textContent = market.symbol ?? "—";

      const price = document.createElement("td");
      const numericPrice = Number(market.price);
      price.textContent =
        market.price != null &&
        market.price !== "" &&
        Number.isFinite(numericPrice)
          ? numericPrice.toLocaleString("en-US", {
              maximumFractionDigits: 6
            })
          : "—";

      const change = document.createElement("td");
      const numericChange = Number(market.changePercent);

      if (
        market.changePercent != null &&
        market.changePercent !== "" &&
        Number.isFinite(numericChange)
      ) {
        change.textContent = `${numericChange >= 0 ? "+" : ""}${numericChange.toFixed(2)}%`;
        change.classList.add(numericChange >= 0 ? "up" : "down");
      } else {
        change.textContent = "—";
      }

      row.append(symbol, price, change);
      marketRows.append(row);
    }

    const staleCount = result.data.markets.filter(
      (market) => market.stale === true
    ).length;

    status.textContent = staleCount
      ? `Showing ${result.data.markets.length} instruments · ${staleCount} have stale prices`
      : `Showing ${result.data.markets.length} instruments · Check individual update times`;
  } catch (error) {
    console.error("Unable to load markets:", error);
    status.textContent =
      "Market data is unavailable. Please try again later.";
  }
}

loadMarkets();
