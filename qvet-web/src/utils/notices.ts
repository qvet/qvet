import { Notice, NoticeSchedule } from "src/utils/config";

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_WEEK = 7 * MS_PER_DAY;

// A restricted subset of ISO 8601 durations: weeks, days, hours and minutes.
// Months and years are deliberately unsupported as they have no fixed length.
const DURATION_PATTERN =
  /^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?=\d)(?:(\d+)H)?(?:(\d+)M)?)?$/;

/**
 * Parse a duration such as `P1W`, `P3D`, `PT12H` or `P1DT6H` to milliseconds.
 *
 * Returns `null` if the value is not a supported duration.
 */
export function parseDuration(value: string): number | null {
  const match = DURATION_PATTERN.exec(value);
  if (match === null) {
    return null;
  }

  const [, weeks, days, hours, minutes] = match;
  if (
    weeks === undefined &&
    days === undefined &&
    hours === undefined &&
    minutes === undefined
  ) {
    return null;
  }

  return (
    Number(weeks ?? 0) * MS_PER_WEEK +
    Number(days ?? 0) * MS_PER_DAY +
    Number(hours ?? 0) * MS_PER_HOUR +
    Number(minutes ?? 0) * MS_PER_MINUTE
  );
}

/**
 * Whether a schedule is active at the given instant.
 *
 * A schedule is active from `start` for `duration`. If `repeat_every` is set,
 * it becomes active again at that interval, indefinitely. If `until` is set,
 * the schedule is never active at or after that instant.
 *
 * All arithmetic is done on epoch milliseconds, so timezones and daylight
 * savings changes have no effect on when a schedule is active.
 *
 * Schedules that cannot be interpreted are never active.
 */
export function isScheduleActive(
  schedule: NoticeSchedule,
  now: number,
): boolean {
  const start = Date.parse(schedule.start);
  const duration = parseDuration(schedule.duration);
  if (Number.isNaN(start) || duration === null || duration <= 0) {
    return false;
  }

  if (schedule.until !== undefined) {
    const until = Date.parse(schedule.until);
    if (Number.isNaN(until) || now >= until) {
      return false;
    }
  }

  if (now < start) {
    return false;
  }
  const elapsed = now - start;

  if (schedule.repeat_every === undefined) {
    return elapsed < duration;
  }

  const repeatEvery = parseDuration(schedule.repeat_every);
  if (repeatEvery === null || repeatEvery <= 0) {
    return false;
  }
  return elapsed % repeatEvery < duration;
}

/**
 * Filter notices to those whose schedule is active at the given instant.
 */
export function activeNotices(
  notices: ReadonlyArray<Notice>,
  now: number,
): Array<Notice> {
  return notices.filter((notice) => isScheduleActive(notice.schedule, now));
}
