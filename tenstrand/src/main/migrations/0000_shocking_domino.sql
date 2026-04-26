CREATE TABLE `districts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`county` text,
	`superintendent_email` text,
	`enrollment_total` integer
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`district_id` text,
	`address` text,
	`city` text,
	`county` text,
	`lat` real,
	`lng` real,
	`enrollment` integer,
	`title1_flag` integer DEFAULT false,
	`geocoding_status` text DEFAULT 'pending',
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teacher_interests` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`topic` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`school_id` text,
	`grade_levels` text,
	`subjects` text,
	`lat` real,
	`lng` real,
	`zip` text,
	`last_active` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'general' NOT NULL,
	`description` text,
	`address` text,
	`lat` real,
	`lng` real,
	`county` text,
	`contact_email` text,
	`website` text,
	`status` text DEFAULT 'active' NOT NULL,
	`profile_score` real DEFAULT 0,
	`geocoding_status` text DEFAULT 'pending'
);
--> statement-breakpoint
CREATE TABLE `program_standards` (
	`id` text PRIMARY KEY NOT NULL,
	`program_id` text NOT NULL,
	`standard_code` text NOT NULL,
	`standard_desc` text,
	`framework` text,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`grade_levels` text,
	`subjects` text,
	`max_students` integer,
	`duration_mins` integer,
	`cost` real DEFAULT 0,
	`season` text,
	`lat` real,
	`lng` real,
	`created_at` integer,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`program_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `engagements` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`program_id` text NOT NULL,
	`type` text NOT NULL,
	`occurred_at` integer,
	`notes` text,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lesson_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`program_id` text,
	`title` text NOT NULL,
	`content` text,
	`grade_level` text,
	`subjects` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`program_id` text NOT NULL,
	`rating` integer,
	`text` text,
	`visited_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `outreach_log` (
	`id` text PRIMARY KEY NOT NULL,
	`prospect_id` text NOT NULL,
	`email_subject` text,
	`email_body` text,
	`sent_at` integer,
	`response_status` text,
	FOREIGN KEY (`prospect_id`) REFERENCES `partner_prospects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `partner_prospects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text,
	`source_url` text,
	`address` text,
	`lat` real,
	`lng` real,
	`county` text,
	`ai_score` real,
	`status` text DEFAULT 'new' NOT NULL,
	`notes` text,
	`outreach_sent_at` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_type` text NOT NULL,
	`recipient_id` text NOT NULL,
	`report_type` text NOT NULL,
	`generated_at` integer NOT NULL,
	`content_json` text,
	`opened_at` integer
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
