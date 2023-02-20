import "../whatsapp";
import { App } from "../app";

declare interface AmizoneCredentials {
  username?: string;
  password?: string;
}

declare interface User {
  readonly phone: string;
  state: string;
  amizoneCredentials: AmizoneCredentials;
}

declare interface BotHandlerContext {
  db: App.Collection;
  bot: WhatsappApiClient;
  payload: Payload;
  user: User;
}
