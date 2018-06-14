import Telebot from "telebot";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_ENABLED } from "./secrets";

const telegram = new Telebot({token: TELEGRAM_BOT_TOKEN});

export function sendMessage (message: string): Promise<any> {
  if (!TELEGRAM_ENABLED) return;

  return telegram.sendMessage(TELEGRAM_CHAT_ID, message).catch((error: any) => {
    console.error(error.description);
    throw error;
  });
}
