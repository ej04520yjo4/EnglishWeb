const padCalendarPart = (value: number) => String(value).padStart(2, "0");

/**
 * Returns the calendar day shown by the learner's current device.
 * Timestamps remain UTC ISO strings; this key intentionally uses local parts.
 */
export const localDateKey = (date = new Date()): string =>
  `${date.getFullYear()}-${padCalendarPart(date.getMonth() + 1)}-${padCalendarPart(date.getDate())}`;
