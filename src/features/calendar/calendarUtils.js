export function startOfMonth(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

export function endOfMonth(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  );
}

export function startOfCalendar(date) {
  const first = startOfMonth(date);

  const day = first.getDay();

  const mondayOffset =
    day === 0
      ? -6
      : 1 - day;

  const result = new Date(first);

  result.setDate(
    first.getDate() + mondayOffset
  );

  return result;
}

export function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function buildCalendar(month) {
  const start = startOfCalendar(month);

  const days = [];

  for (let i = 0; i < 42; i++) {
    const date = new Date(start);

    date.setDate(start.getDate() + i);

    days.push(date);
  }

  return days;
}

export function monthLabel(date) {
  return date.toLocaleDateString(
    "en-AU",
    {
      month: "long",
      year: "numeric",
    }
  );
}

export function previousMonth(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() - 1,
    1
  );
}

export function nextMonth(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    1
  );
}