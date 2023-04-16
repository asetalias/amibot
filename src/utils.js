import * as amizone from "amizone_api";

/**
 * @param {BotHandlerContext} ctx
 * @returns AmizoneServiceApi
 */
export const newAmizoneClient = ({ username, password }) => new amizone.AmizoneServiceApi(
    new amizone.Configuration({
      username,
      password,
    })
  );

/**
 * Find and return the first non-empty among the strings passed. If none, an empty string is returned.
 * @param {string[]} values
 */
export const firstNonEmpty = (...values) =>
  values.find((val) => val != null && typeof val === "string" && val !== "") ??
  "";

