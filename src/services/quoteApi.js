const QUOTE_API_BASE =
  "http://127.0.0.1:4182/api";

async function request(
  path,
  options = {}
) {
  const response = await fetch(
    `${QUOTE_API_BASE}${path}`,
    {
      ...options,
      headers: {
        "Content-Type":
          "application/json",
        ...(options.headers || {}),
      },
    }
  );

  let payload = null;

  try {
    payload =
      await response.json();
  } catch {
    payload = null;
  }

  if (
    !response.ok ||
    payload?.ok === false
  ) {
    throw new Error(
      payload?.error ||
        `Quote API request failed (${response.status}).`
    );
  }

  return payload;
}

export async function getQuotes(
  filters = {}
) {
  const params =
    new URLSearchParams();

  if (filters.clientId) {
    params.set(
      "clientId",
      filters.clientId
    );
  }

  if (filters.jobId) {
    params.set(
      "jobId",
      filters.jobId
    );
  }

  const query =
    params.toString();

  const payload =
    await request(
      `/quotes${
        query
          ? `?${query}`
          : ""
      }`
    );

  return payload.quotes || [];
}

export async function getQuote(
  quoteId
) {
  const payload =
    await request(
      `/quotes/${encodeURIComponent(
        quoteId
      )}`
    );

  return payload.quote;
}

export async function createQuote(
  quote
) {
  const payload =
    await request(
      "/quotes",
      {
        method: "POST",
        body: JSON.stringify({
          quote,
        }),
      }
    );

  return payload.quote;
}

export async function updateQuote(
  quote
) {
  if (!quote?.id) {
    throw new Error(
      "Cannot update a quote without an id."
    );
  }

  const payload =
    await request(
      `/quotes/${encodeURIComponent(
        quote.id
      )}`,
      {
        method: "PUT",
        body: JSON.stringify({
          quote,
        }),
      }
    );

  return payload.quote;
}

export async function saveQuote(
  quote
) {
  return quote?.id
    ? updateQuote(quote)
    : createQuote(quote);
}

export async function deleteQuote(
  quoteId
) {
  await request(
    `/quotes/${encodeURIComponent(
      quoteId
    )}`,
    {
      method: "DELETE",
    }
  );
}