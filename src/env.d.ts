/// <reference types="astro/client" />

declare global {
  interface ImportMetaEnv {
    readonly GMAIL_USER?: string;
    readonly GMAIL_APP_PASSWORD?: string;
    readonly MAIL_TO?: string;

    readonly YOUTUBE_API_KEY?: string;
    readonly YOUTUBE_CHANNEL_ID?: string;

    readonly GEMINI_API_KEY?: string;
    readonly CONTACT_EMAIL?: string;
    readonly CHAT_RATE_LIMIT_WINDOW_MS?: string;
    readonly CHAT_RATE_LIMIT_MAX_REQUESTS?: string;
    readonly WHATSAPP_PROVIDER?: string;
    readonly WHATSAPP_ACCESS_TOKEN?: string;
    readonly META_WA_ACCESS_TOKEN?: string;
    readonly META_WA_PHONE_NUMBER_ID?: string;
    readonly META_WA_VERIFY_TOKEN?: string;
    readonly META_WA_APP_SECRET?: string;
    readonly N8N_WHATSAPP_WEBHOOK_URL?: string;
    readonly N8N_INSTAGRAM_WEBHOOK_URL?: string;
    readonly N8N_WEBHOOK_URL_w2n_Gesichter_der_Stadt?: string;
    readonly N8N_WEBHOOK_URL_w2n_Gescihter_der_Stadt?: string;
    readonly N8N_WEBHOOK_SECRET?: string;
    readonly TWILIO_ACCOUNT_SID?: string;
    readonly TWILIO_AUTH_TOKEN?: string;
    readonly PUBLIC_META_APP_ID?: string;
    readonly PUBLIC_META_CONFIG_ID?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
