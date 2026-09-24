import { createServer } from "node:http";

const PORT = 4184;
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_BODY_BYTES = 512 * 1024;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        reject(new Error("Request body too large."));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function buildPrompt(message, context) {
  const isBizziBuddi = context?.product === "BizziBuddi";
  const assistantName = isBizziBuddi ? "Buddi" : "Donna";
  const productDescription = isBizziBuddi
    ? "the friendly business assistant inside BizziBuddi, a business management platform"
    : "the friendly workflow assistant inside Chrysalis Studio, a dressmaking business operating system";
  const productGuidance = isBizziBuddi
    ? "\nBizziBuddi guidance:\n- When the user asks what needs attention today, prioritise the supplied dashboardAttention items and current business context.\n- Give a concise business-priority response: identify the most important items first, briefly explain why they matter, then suggest the next practical action.\n- Do not invent urgency or treat routine information as urgent.\n- Keep this kind of response to a short list or a few compact paragraphs.\n"
    : "";

  return `You are ${assistantName}, ${productDescription}.\n\nRules:\n- Be concise, practical, and professional.\n- Use only the supplied business context.\n- Never invent clients, payments, dates, jobs, appointments, production records, or business details.\n- If the context does not contain an answer, say so clearly.\n- Treat business and financial details as confidential.\n- Do not claim to have performed an action unless the application confirms it.${productGuidance}\nBusiness context:\n${JSON.stringify(context ?? {}, null, 2)}\n\nUser question:\n${message}`;
}

async function askOpenAI(message, context) {
  const result = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: buildPrompt(message, context) }],
      max_tokens: 700,
    }),
  });

  const payload = await result.json();
  if (!result.ok) {
    throw new Error(payload?.error?.message || "OpenAI request failed.");
  }

  const text = payload?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("The assistant returned an empty response.");
  return text;
}

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/api/health") {
    sendJson(response, 200, { ok: true, service: "donna", configured: Boolean(API_KEY), provider: "openai", model: MODEL });
    return;
  }

  if (request.method !== "POST" || request.url !== "/api/donna/chat") {
    sendJson(response, 404, { error: "Not found." });
    return;
  }

  if (!API_KEY) {
    sendJson(response, 503, { error: "The assistant is not configured. Add OPENAI_API_KEY to the server environment." });
    return;
  }

  try {
    const body = JSON.parse(await readBody(request));
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      sendJson(response, 400, { error: "A message is required." });
      return;
    }

    const answer = await askOpenAI(message, body.context || {});
    sendJson(response, 200, { answer });
  } catch (error) {
    console.error("Assistant request failed:", error);
    sendJson(response, 500, { error: error.message || "The assistant could not respond." });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Assistant service listening on http://127.0.0.1:${PORT}`);
});
