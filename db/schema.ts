import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
}, (table) => [uniqueIndex("idx_registrations_identifier_code").on(table.identifierCode)]);
