
247
248
249
250
251
252
253
254
255
256
257
258
259
260
261
262
263
264
265
266
267
268
269
270
271
272
273
274
275
276
277
278
279
280
281
282
283
284
285
286
287
288
289
290
291
292
293
294
295
296
297
298
299
300
301
302
303
304
305
306
307
308
309
310
311
import Card from "../common/Card";
  },
  attention: {
    border: "#CA8A04",
    background: "#FEFCE8",
    text: "#854D0E",
  },
  info: {
    border: "#2563EB",
    background: "#EFF6FF",
    text: "#1D4ED8",
  },
};

function getOutstanding(job) {
  const total = Number(
    job.price ??
      job.total ??
      job.quoteTotal ??
      0
  );

  const payments = Array.isArray(job.payments)
    ? job.payments
    : [];

  const totalPaid = payments.reduce(
    (sum, payment) =>
      sum + Number(payment.amount || 0),
    0
  );

  return Math.max(total - totalPaid, 0);
}

function startOfDay(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function differenceInDays(a, b) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round(
    (a.getTime() - b.getTime()) /
      millisecondsPerDay
  );
}

function formatDate(date) {
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}
