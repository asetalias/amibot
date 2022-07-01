import * as amizone from "amizone_api";

export function callAmizoneApi(user, pass) {
  const api = new amizone.AmizoneServiceApi(
    new amizone.Configuration({
      username: `${user}`,
      password: `${pass}`,
    })
  );
  return api;
}
