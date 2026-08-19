const padCalendarPart = (value: number) => String(value).padStart(2, "0");

/**
 * Returns the calendar day shown by the learner's current device.
 * Timestamps remain UTC ISO strings; this key intentionally uses local parts.
 */
export const localDateKey = (date = new Date()): string =>
  `${date.getFullYear()}-${padCalendarPart(date.getMonth() + 1)}-${padCalendarPart(date.getDate())}`;

/** Counts unique study days inside the learner's current Monday-Sunday week. */
export const studyDaysThisWeek = (
  studyDates: readonly string[],
  today = new Date(),
): number => {
  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const mondayKey = localDateKey(monday);
  const sundayKey = localDateKey(sunday);
  return new Set(
    studyDates.filter(
      (date) =>
        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        date >= mondayKey &&
        date <= sundayKey,
    ),
  ).size;
};
