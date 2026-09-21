CREATE TABLE `payment_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`registration_id` text NOT NULL,
	`object_key` text NOT NULL,
	`original_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_payment_receipts_registration` ON `payment_receipts` (`registration_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_payment_receipts_object_key` ON `payment_receipts` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_payment_receipts_created_at` ON `payment_receipts` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_registrations_status` ON `registrations` (`status`);--> statement-breakpoint
PRAGMA optimize;
