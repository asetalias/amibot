import * as amizone from "amizone_api";
import { AmizoneCredentials } from "./states/states.js";

export const newAmizoneClient = ({
  username,
  password,
}: AmizoneCredentials) => {
  if (!username || !password) {
    throw new Error("credentials must be populated when creating new client!");
  }
  return new amizone.AmizoneServiceApi(
    new amizone.Configuration({
      username,
      password,
    })
  );
};

/**
 * Find and return the first non-empty among the strings passed. If none, an empty string is returned.
 */
export const firstNonEmpty = (...values: string[]) =>
  values.find((val) => val != null && typeof val === "string" && val !== "") ??
  "";
