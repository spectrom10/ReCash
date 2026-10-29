
const SYSTEM_PROMPT = `
You are ReCash AI, a clear and cautious financial education assistant.

Explain financial markets, currencies, stocks, ETFs, economics,
and financial news in accessible language.

Be helpful, accurate, and concise.
Do not invent current prices, breaking news, or market events.
If live information is unavailable, say so clearly.
Distinguish facts from uncertainty and opinions.
Do not provide personalized investment recommendations.
Never guarantee financial outcomes.
`;

export async function onRequestPost({ request, env }) {
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });

  // Security switch: AI stays disabled until explicitly enabled.
  if (env.CHAT_ENABLED !== "true") {
    return json({
      error: "ReCash AI is temporarily unavailable."
    }, 503);
  }

  // The Groq API key must remain in Cloudflare secrets.
  if (!env.GROQ_API_KEY) {
    return json({
      error: "AI service is not configured."
    }, 503);
  }

  // Basic daily usage protection.
  // Note: KV is not an atomic counter.
  const DAILY_CHAT_LIMIT = 20;

  if (!env.AI_LIMITS) {
    return json({
      error: "AI usage protection is not configured."
    }, 503);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const message =
    typeof body.message === "string"
      ? body.message.trim()
      : "";

  if (!message || message.length > 1000) {
    return json({
      error: "Please enter a question of up to 1,000 characters."
    }, 400);
  }

  const history = Array.isArray(body.history)
    ? body.history
        .slice(-6)
        .filter(item =>
          item &&
          ["user", "assistant"].includes(item.role) &&
          typeof item.content === "string" &&
          item.content.length <= 2000
        )
        .map(item => ({
          role: item.role,
          content: item.content
        }))
    : [];

  const today = new Date().toISOString().slice(0, 10);
  const usageKey = `recash-chat-${today}`;

  try {
    const used = Number(
      (await env.AI_LIMITS.get(usageKey)) || 0
    );

    if (used >= DAILY_CHAT_LIMIT) {
      return json({
        error:
          "ReCash AI has reached its daily question limit. " +
          "Please try again tomorrow."
      }, 429);
    }

    // Count the request before contacting Groq.
    await env.AI_LIMITS.put(
      usageKey,
      String(used + 1),
      { expirationTtl: 172800 }
    );

    // Abort the Groq request after 15 seconds.
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      15000
    );

    let response;

    try {
      response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Authorization": `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-20b",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...history,
              { role: "user", content: message }
            ],
            temperature: 0.3,
            max_tokens: 700
          })
        }
      );
    } finally {
      // Always clear the timer, even if the request fails.
      clearTimeout(timeout);
    }

    if (!response.ok) {
      console.error(
        "Groq request failed:",
        response.status
      );

      return json({
        error: "AI is temporarily unavailable."
      }, 502);
    }

    const result = await response.json();
    const reply = result.choices?.[0]?.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
      return json({
        error: "AI returned an empty response."
      }, 502);
    }

    return json({ reply: reply.trim() });
  } catch (error) {
    console.error("Chat endpoint error:", error);

    return json({
      error: "Unable to process your question."
    }, 500);
  }
}
