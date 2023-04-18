import { WhatsappApiClient, WhatsappPayload } from "../whatsapp";

import { Collection } from "mongodb";

export const states = {
  NEW_USER: "NEW_USER",
  EXPECT_USERNAME: "EXPECT_USERNAME",
  EXPECT_PASSWORD: "EXPECT_PASSWORD",
  LOGGED_IN: "LOGGED_IN",
  EXPECT_SCHEDULE_DATE: "EXPECT_SCHEDULE_DATE",
  EXPECT_FACULTY_FEEDBACK_SPEC: "EXPECT_FACULTY_FEEDBACK_SPEC",
};

export type AmizoneCredentials = {
  username: string | null | undefined;
  password: string | null | undefined;
}

export interface User {
  readonly phone: String,
  state: String,
  amizoneCredentials: AmizoneCredentials;
};

export interface BotHandlerContext {
  db: Collection;
  bot: WhatsappApiClient;
  payload: WhatsappPayload;
  user: User;
}

export const DEFAULT_STATE = states.NEW_USER;
