import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const registrations = sqliteTable("registrations", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  age: integer("age").notNull(),
  city: text("city").notNull(),
  field: text("field").notNull(),
  education: text("education").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  source: text("source").notNull(),
  status: text("status").notNull().default("pending"),
  baseAmount: integer("base_amount").notNull().default(200000),
  discountCode: text("discount_code"),
  discountPercent: integer("discount_percent").notNull().default(0),
  finalAmount: integer("final_amount").notNull().default(200000),
  identifierCode: text("identifier_code"),
  paymentReference: text("payment_reference"),
  createdAt: text("created_at").notNull(),
  paidAt: text("paid_at"),
}, (table) => [
  uniqueIndex("idx_registrations_identifier_code").on(table.identifierCode),
  index("idx_registrations_created_at").on(table.createdAt),
]);

export const notificationOutbox = sqliteTable("notification_outbox", {
  id: text("id").primaryKey(),
  registrationId: text("registration_id").notNull(),
  recipient: text("recipient").notNull(),
  status: text("status").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  createdAt: text("created_at").notNull(),
  sentAt: text("sent_at"),
}, (table) => [
  uniqueIndex("idx_notification_registration_recipient").on(table.registrationId, table.recipient),
  index("idx_notification_status").on(table.status),
]);
