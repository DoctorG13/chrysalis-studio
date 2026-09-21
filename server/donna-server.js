import { createServer } from "node:http";

const PORT = 4184;
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3.6-flash";
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
  return `You are Donna, the friendly workflow assistant inside Chrysalis Studio, a dressmaking business operating system.\n\nRules:\n- Be concise, practical, and professional.\n- Use only the supplied workspace context.\n- Never invent clients, payments, dates, or job details.\n- If the context does not contain an answer, say so clearly.\n- Treat client measurements and financial details as confidential.\n- Do not claim to have performed an action unless the application confirms it.\n\nWorkspace context:\n${JSON.stringify(context ?? {}, null, 2)}\n\nUser question:\n${message}`;
}

async function askGemini(message, context) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(API_KEY)}`;
  const result = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildPrompt(message, context) }] }],
      generationConfig: { maxOutputTokens: 700 },
    }),
  });

  const payload = await result.json();
  if (!result.ok) {
    throw new Error(payload?.error?.message || "AI request failed.");
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) throw new Error("The assistant returned an empty response.");
  return text;
}

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/api/health") {
    sendJson(response, 200, { ok: true, service: "donna", configured: Boolean(API_KEY) });
    return;
  }

  if (request.method !== "POST" || request.url !== "/api/donna/chat") {
    sendJson(response, 404, { error: "Not found." });
    return;
  }

  if (!API_KEY) {
    sendJson(response, 503, { error: "The assistant is not configured. Add GEMINI_API_KEY to the server environment." });
    return;
  }

  try {
    const body = JSON.parse(await readBody(request));
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      sendJson(response, 400, { error: "A message is required." });
      return;
    }

    const answer = await askGemini(message, body.context || {});
    sendJson(response, 200, { answer });
  } catch (error) {
    console.error("Assistant request failed:", error);
    sendJson(response, 500, { error: error.message || "The assistant could not respond." });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Assistant service listening on http://127.0.0.1:${PORT}`);
});
