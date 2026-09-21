CREATE TABLE `notification_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`registration_id` text NOT NULL,
	`recipient` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` text NOT NULL,
	`sent_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_notification_registration_recipient` ON `notification_outbox` (`registration_id`,`recipient`);--> statement-breakpoint
CREATE INDEX `idx_notification_status` ON `notification_outbox` (`status`);--> statement-breakpoint
CREATE INDEX `idx_registrations_created_at` ON `registrations` (`created_at`);
--> statement-breakpoint
PRAGMA optimize;
