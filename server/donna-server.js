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

function cleanLocation(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 120);
}


async function geocodeLocation(location) {
  const input = cleanLocation(location);
  const countryNames = [
    "United Kingdom", "United States", "New Zealand", "South Africa",
    "United Arab Emirates", "Saudi Arabia", "Netherlands", "Sri Lanka",
    "Bangladesh", "Philippines", "Australia", "Canada", "Ireland",
    "France", "Germany", "Italy", "Spain", "India", "Japan", "Singapore",
    "Brazil", "Mexico", "Belgium", "Switzerland", "Austria", "Portugal",
    "Indonesia", "Malaysia", "Thailand", "Vietnam", "Pakistan", "Egypt",
    "Kenya", "Nigeria", "Greece", "Sweden", "Norway", "Denmark", "Finland",
    "Poland", "Ukraine", "Turkey", "Argentina", "Chile", "Colombia", "Peru",
    "Fiji", "UK", "USA", "US"
  ];

  let searchName = input;
  let requestedCountry = "";

  const countryPattern = new RegExp(
    "(?:,\\s*|\\s+)(" +
      countryNames
        .slice()
        .sort((a, b) => b.length - a.length)
        .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|") +
      ")\\s*$",
    "i"
  );

  const countryMatch = input.match(countryPattern);

  if (countryMatch) {
    requestedCountry = countryMatch[1].toLowerCase();
    searchName = input.slice(0, countryMatch.index).replace(/[, ]+$/, "").trim();
  }

  const query = new URLSearchParams({
    name: searchName || input,
    count: "10",
    language: "en",
    format: "json"
  });

  const response = await fetch(
    "https://geocoding-api.open-meteo.com/v1/search?" + query
  );

  if (!response.ok) {
    throw new Error("The location service is temporarily unavailable.");
  }

  const payload = await response.json();
  const results = payload?.results || [];

  if (!results.length) {
    throw new Error(
      "I couldn't find '" + input +
      "'. Try a city and country, such as 'Ipswich, Australia'."
    );
  }

  const aliases = {
    "united states": ["united states", "united states of america"],
    "united kingdom": ["united kingdom", "uk", "great britain"],
    "uk": ["united kingdom", "uk", "great britain"],
    "usa": ["united states", "united states of america"],
    "us": ["united states", "united states of america"]
  };

  if (requestedCountry) {
    const acceptableCountries = aliases[requestedCountry] || [requestedCountry];
    const place = results.find((result) =>
      acceptableCountries.includes(String(result.country || "").trim().toLowerCase())
    );

    if (!place) {
      throw new Error(
        "I couldn't find '" + searchName + "' in " +
        countryMatch[1] + ". Please check the location and country."
      );
    }

    return place;
  }

  const exactMatches = results.filter(
    (result) => String(result.name || "").toLowerCase() === searchName.toLowerCase()
  );

  const uniquePlaces = [];
  const seenPlaces = new Set();

  for (const result of exactMatches) {
    const key = [
      result.name,
      result.admin1,
      result.country
    ].filter(Boolean).join("|").toLowerCase();

    if (!seenPlaces.has(key)) {
      seenPlaces.add(key);
      uniquePlaces.push(result);
    }
  }

    if (uniquePlaces.length > 1) {
    // Prefer the Australian city when "Brisbane" is entered without a country.
    // Explicit country-qualified requests are handled above and remain unchanged.
    if (searchName.toLowerCase() === "brisbane") {
      const australianBrisbane = uniquePlaces.find((result) =>
        String(result.country || "").trim().toLowerCase() === "australia" &&
        String(result.admin1 || "").trim().toLowerCase() === "queensland"
      );

      if (australianBrisbane) {
        return australianBrisbane;
      }
    }

    const error = new Error("Please choose which location you mean.");
    error.code = "AMBIGUOUS_LOCATION";
    error.locations = uniquePlaces.slice(0, 5).map((result) => ({
      name: result.name,
      region: result.admin1 || "",
      country: result.country || "",
      location: [result.name, result.admin1, result.country]
        .filter(Boolean).join(", ")
    }));
    throw error;
  }

  return exactMatches[0] || results[0];
}

function formatPlaceTime(date, timeZone) {
  return new Intl.DateTimeFormat("en-AU", { timeZone, weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "long" }).format(date);
}

const weatherDescriptions = { 0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle", 56: "Light freezing drizzle", 57: "Dense freezing drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain", 66: "Light freezing rain", 67: "Heavy freezing rain", 71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow", 77: "Snow grains", 80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers", 85: "Slight snow showers", 86: "Heavy snow showers", 95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail" };

function resolveLiveInfoLocation(location) {
  const value = cleanLocation(location);

  if (/^(here|my current location|where i am)$/i.test(value)) {
    return "Brisbane, Queensland, Australia";
  }

  return value;
}

async function getLiveInformation(kind, rawLocation, rawQuestion = "") {
  const location = resolveLiveInfoLocation(rawLocation);
  
  if (!location) return { answer: kind === "weather" ? "Which city or town should I check the weather for? For example, Brisbane." : "Which city should I check the current time for? For example, London." };

  const place = await geocodeLocation(location);
  const placeName = [place.name, place.admin1, place.country].filter(Boolean).filter((part, index, all) => all.indexOf(part) === index).join(", ");
  const timeZone = place.timezone || "UTC";
  const now = new Date();
  if (kind === "time") return { answer: "**Current time in " + placeName + "**\n" + formatPlaceTime(now, timeZone) + "\n\nTime zone: " + timeZone + ".", source: "Open-Meteo geocoding and IANA time-zone data", updatedAt: now.toISOString() };
  if (kind !== "weather") throw new Error("Unsupported live information request.");
  const query = new URLSearchParams({ latitude: String(place.latitude), longitude: String(place.longitude), current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m", daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max", forecast_days: "7", timezone: timeZone, temperature_unit: "celsius", wind_speed_unit: "kmh" });
  const response = await fetch("https://api.open-meteo.com/v1/forecast?" + query);
  if (!response.ok) throw new Error("The weather service is temporarily unavailable. Please try again shortly.");
  const weather = await response.json();
  const current = weather.current;
  if (!current) throw new Error("The weather service did not return current conditions.");
  
  const lines = [
    "**Weather in " + placeName + "**",
    "Now: " + (weatherDescriptions[current.weather_code] || "Conditions unavailable") + ", " + Math.round(current.temperature_2m) + "°C (feels like " + Math.round(current.apparent_temperature) + "°C).",
    "Humidity: " + Math.round(current.relative_humidity_2m) + "% | Wind: " + Math.round(current.wind_speed_10m) + " km/h | Precipitation: " + Number(current.precipitation || 0).toFixed(1) + " mm.",
    "",
    "**Next 7 days**"
  ];


for (let i = 0; i < (weather.daily?.time || []).length; i += 1) {
  const date = new Date(weather.daily.time[i] + "T12:00:00Z");
  const day = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short"
  }).format(date);
  const desc =
    weatherDescriptions[weather.daily.weather_code[i]] ||
    "Conditions unavailable";
  const rain = weather.daily.precipitation_probability_max?.[i];

  lines.push(
    "- " + day + ": " + desc + ", " +
    Math.round(weather.daily.temperature_2m_min[i]) + "–" +
    Math.round(weather.daily.temperature_2m_max[i]) + "°C" +
    (rain == null ? "" : ", up to " + rain + "% chance of precipitation") +
    "."
  );
}


const question = String(rawQuestion || "");

const asksTomorrow = /\b(tomorrow|next day)\b/i.test(question);
const asksWeekend = /\b(this weekend|the weekend|weekend)\b/i.test(question);
const asksTemperature =
  /\b(how warm|how hot|temperature|temperatures|warm|hot)\b/i.test(question);

const dayMatch = question.match(
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
);
const asksAnotherDay = Boolean(dayMatch);

const asksRainLikelihood =
  /\b(likely|chance|probability|will it rain|rain likely)\b/i.test(question) &&
  /\b(rain|precipitation)\b/i.test(question);

const dailyDates = weather.daily?.time || [];

function getDayLabel(date) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "short"
  }).format(new Date(date + "T12:00:00Z"));
}

function findDayIndex(dayName) {
  return dailyDates.findIndex((date) => {
    const weekday = new Intl.DateTimeFormat("en-AU", {
      timeZone,
      weekday: "long"
    }).format(new Date(date + "T12:00:00Z"));

    return weekday.toLowerCase() === dayName.toLowerCase();
  });
}

const weekendIndices = dailyDates
  .map((date, index) => {
    const weekday = new Intl.DateTimeFormat("en-AU", {
      timeZone,
      weekday: "long"
    }).format(new Date(date + "T12:00:00Z")).toLowerCase();

    return ["saturday", "sunday"].includes(weekday) ? index : -1;
  })
  .filter((index) => index >= 0);

let forecastIndex = asksTomorrow
  ? 1
  : asksAnotherDay
    ? findDayIndex(dayMatch[1])
    : 0;

let dayLabel = asksTomorrow
  ? "tomorrow"
  : asksAnotherDay
    ? dayMatch[1]
    : "today";

if (asksWeekend && asksTemperature) {
  if (weekendIndices.length) {
    const weekendLines = weekendIndices.map((index) =>
      getDayLabel(dailyDates[index]) + ": " +
      Math.round(weather.daily.temperature_2m_min[index]) + "–" +
      Math.round(weather.daily.temperature_2m_max[index]) + "°C"
    );

    lines.splice(
      1,
      0,
      "**Weekend temperatures in " + placeName + "**",
      ...weekendLines
    );
  } else {
    lines.splice(
      1,
      0,
      "I couldn't find the weekend temperatures in the available forecast data."
    );
  }
} else if (asksTemperature && (asksTomorrow || asksAnotherDay)) {
  if (forecastIndex >= 0 && dailyDates[forecastIndex]) {
    lines.splice(
      1,
      0,
      "**Temperatures for " + getDayLabel(dailyDates[forecastIndex]) +
        " in " + placeName + "**",
      "Expected temperature: " +
        Math.round(weather.daily.temperature_2m_min[forecastIndex]) + "–" +
        Math.round(weather.daily.temperature_2m_max[forecastIndex]) + "°C."
    );
  } else {
    lines.splice(
      1,
      0,
      "I couldn't find that day's temperature forecast in the available data."
    );
  }
} else if (asksRainLikelihood) {
  if (asksWeekend) {
    if (weekendIndices.length) {
      const weekendRainLines = weekendIndices.map((index) => {
        const probability =
          weather.daily.precipitation_probability_max?.[index];

        return getDayLabel(dailyDates[index]) + ": " +
          (probability == null
            ? "rain probability unavailable"
            : "up to " + probability + "% chance of precipitation");
      });

      lines.splice(
        1,
        0,
        "**Weekend rain forecast in " + placeName + "**",
        ...weekendRainLines
      );
    } else {
      lines.splice(
        1,
        0,
        "I couldn't find the weekend rain forecast in the available data."
      );
    }
  } else if (forecastIndex >= 0 && dailyDates[forecastIndex]) {
    const probability =
      weather.daily?.precipitation_probability_max?.[forecastIndex];

    if (probability != null) {
      const likelihood =
        probability >= 50
          ? "Rain is likely "
          : probability >= 20
            ? "Rain is possible "
            : "Rain is unlikely ";

      lines.splice(
        1,
        0,
        likelihood + dayLabel + " in " + placeName + ": up to " +
          probability + "% chance of precipitation."
      );
    } else {
      lines.splice(
        1,
        0,
        "I couldn't determine the rain probability for " + dayLabel + "."
      );
    }
  } else {
    lines.splice(
      1,
      0,
      "I couldn't find the rain forecast for " + dayLabel + "."
    );
  }
} else if (asksTomorrow || asksAnotherDay) {
  if (forecastIndex >= 0 && dailyDates[forecastIndex]) {
    const index = forecastIndex;
    const description =
      weatherDescriptions[weather.daily.weather_code[index]] ||
      "Conditions unavailable";
    const probability =
      weather.daily.precipitation_probability_max?.[index];

    lines.splice(
      1,
      0,
      "**Forecast for " + getDayLabel(dailyDates[index]) +
        " in " + placeName + "**",
      description + ", " +
        Math.round(weather.daily.temperature_2m_min[index]) + "–" +
        Math.round(weather.daily.temperature_2m_max[index]) + "°C" +
        (probability == null
          ? "."
          : ", up to " + probability + "% chance of precipitation.")
    );
  } else {
    lines.splice(
      1,
      0,
      "I couldn't find that day's forecast in the available forecast data."
    );
  }
}


return {
  answer: lines.join("\n"),
  source: "Open-Meteo",
  updatedAt: current.time || now.toISOString(),
  timezone: timeZone
};
}

const server = createServer(async (request, response) => {

if (request.method === "GET" && request.url === "/api/health") {
sendJson(response, 200, {
ok: true,
service: "donna",
configured: Boolean(API_KEY),
provider: "openai",
model: MODEL
});
return;
}

if (request.method === "POST" && request.url === "/api/donna/live-info") {
  try {
    const body = JSON.parse(await readBody(request));
    const kind =
      body?.kind === "weather"
        ? "weather"
        : body?.kind === "time"
          ? "time"
          : "";

    if (!kind) {
      sendJson(response, 400, { error: "Choose either time or weather." });
      return;
    }

    sendJson(
      response,
      200,
      await getLiveInformation(kind, body.location, body.question)
    );
  } catch (error) {
    if (error.code === "AMBIGUOUS_LOCATION") {
      sendJson(response, 200, {
        needsLocationChoice: true,
        answer: "I found several places with that name. Which one do you mean?",
        locations: error.locations || []
      });
    } else {
      sendJson(response, 502, {
        error: error.message || "Live information is temporarily unavailable."
      });
    }
  }

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
