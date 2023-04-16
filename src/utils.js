import * as amizone from "amizone_api";

const OFFSET_IST = 330;
const MINUTE_TO_MS = 60_000;
const DAY_TO_MINUTE = 24 * 60;
const currentTzOffset = new Date().getTimezoneOffset();

/**
 * @param {BotHandlerContext} ctx
 * @returns AmizoneServiceApi
 */
export const newAmizoneClient = ({ username, password }) => {
  return new amizone.AmizoneServiceApi(
    new amizone.Configuration({
      username,
      password,
    })
  );
};

/**
 * Find and return the first non-empty among the strings passed. If none, an empty string is returned.
 * @param {string[]} values
 */
export const firstNonEmpty = (...values) =>
  values.find((val) => val != null && typeof val === "string" && val !== "") ??
  "";

/**
 * @param {Date} date
 * @returns {Date}
 */
const dateToIST = (date) =>
  new Date(date.getTime() + (OFFSET_IST - currentTzOffset) * MINUTE_TO_MS);

/**
 * Render a relative date, in days from NOW, to a "YYYY-MM-DD" format.
 * @param {number} d
 * @returns {string}
 */
export const renderRelativeDate = (d) => {
  const relativeDate = new Date(
    dateToIST(new Date()).getTime() + d * DAY_TO_MINUTE * MINUTE_TO_MS
  );
  return `${relativeDate.getFullYear()}-${relativeDate.getMonth() + 1
    }-${relativeDate.getDate()}`;
};
