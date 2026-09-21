CREATE TABLE `registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`age` integer NOT NULL,
	`city` text NOT NULL,
	`field` text NOT NULL,
	`education` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`source` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`base_amount` integer DEFAULT 200000 NOT NULL,
	`discount_code` text,
	`discount_percent` integer DEFAULT 0 NOT NULL,
	`final_amount` integer DEFAULT 200000 NOT NULL,
	`identifier_code` text,
	`payment_reference` text,
	`created_at` text NOT NULL,
	`paid_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_registrations_identifier_code` ON `registrations` (`identifier_code`);
--> statement-breakpoint
PRAGMA optimize;
