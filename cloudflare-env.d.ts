declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ADMIN_PASSWORD?: string;
    ADMIN_SESSION_SECRET?: string;
    REGISTRATION_NOTIFICATION_TO?: string;
    RESEND_API_KEY?: string;
    REGISTRATION_FROM_EMAIL?: string;
    PAYMENT_CARD_NUMBER?: string;
    PAYMENT_CARD_HOLDER?: string;
    PAYMENT_BANK_NAME?: string;
    INTERNAL_API_KEY?: string;
  }
}
