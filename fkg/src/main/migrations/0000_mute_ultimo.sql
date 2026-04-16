CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'staff' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`user_name` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`old_value_json` text,
	`new_value_json` text,
	`ip` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `product_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`parent_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`image_path` text NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `product_size_charts` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`size_label` text NOT NULL,
	`chest` real,
	`waist` real,
	`hips` real,
	`length` real,
	`sleeve` real,
	`neck` real,
	`custom_json` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`category_id` text,
	`fabric_id` text,
	`color_primary` text,
	`color_secondary` text,
	`size_type` text DEFAULT 'standard',
	`cost_price` real DEFAULT 0 NOT NULL,
	`sell_price` real DEFAULT 0 NOT NULL,
	`wholesale_price` real,
	`rental_price` real,
	`stock_qty` integer DEFAULT 0 NOT NULL,
	`reserved_qty` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer DEFAULT 5 NOT NULL,
	`reorder_qty` integer DEFAULT 10,
	`barcode` text,
	`description` text,
	`design_notes` text,
	`embellishment_tags` text,
	`season_tag` text,
	`collection_name` text,
	`storage_location` text,
	`is_active` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'active',
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`type` text NOT NULL,
	`qty_change` integer NOT NULL,
	`reference_type` text,
	`reference_id` text,
	`note` text,
	`reason` text,
	`created_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fabric_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`fabric_id` text NOT NULL,
	`type` text NOT NULL,
	`qty_change` real NOT NULL,
	`reference_id` text,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`fabric_id`) REFERENCES `fabrics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fabric_suppliers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`address` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `fabrics` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`color` text,
	`width_cm` real,
	`unit` text DEFAULT 'meter' NOT NULL,
	`cost_per_unit` real DEFAULT 0 NOT NULL,
	`stock_qty` real DEFAULT 0 NOT NULL,
	`low_stock_threshold` real DEFAULT 5 NOT NULL,
	`supplier_id` text,
	`photo_path` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`supplier_id`) REFERENCES `fabric_suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vendor_availability` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`date` text NOT NULL,
	`is_available` integer DEFAULT true NOT NULL,
	`capacity_slots` integer DEFAULT 5,
	`booked_slots` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vendor_ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`work_order_id` text,
	`quality_score` integer,
	`timeliness_score` integer,
	`communication_score` integer,
	`note` text,
	`created_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vendor_services` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`service_type` text NOT NULL,
	`price_economy` real,
	`price_standard` real,
	`price_premium` real,
	`turnaround_days_min` integer,
	`turnaround_days_max` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`whatsapp` text,
	`address` text,
	`city` text,
	`cnic` text,
	`specialty_tags_json` text,
	`rating_avg` real DEFAULT 0,
	`total_paid` real DEFAULT 0,
	`is_active` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `customer_interactions` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`type` text NOT NULL,
	`note` text,
	`follow_up_date` text,
	`follow_up_done` integer DEFAULT false,
	`created_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer_measurements` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`garment_type` text NOT NULL,
	`label` text,
	`chest` real,
	`waist` real,
	`hips` real,
	`shoulder` real,
	`length` real,
	`sleeve` real,
	`neck` real,
	`inseam` real,
	`custom_json` text,
	`taken_by` text,
	`taken_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`taken_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#6366f1' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`whatsapp` text,
	`email` text,
	`address` text,
	`city` text,
	`dob` text,
	`loyalty_points` integer DEFAULT 0 NOT NULL,
	`loyalty_tier` text DEFAULT 'bronze',
	`tags_json` text,
	`notes` text,
	`photo_path` text,
	`referred_by_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`type` text NOT NULL,
	`value` real NOT NULL,
	`min_order_value` real DEFAULT 0,
	`max_uses` integer DEFAULT 0,
	`used_count` integer DEFAULT 0 NOT NULL,
	`valid_from` text,
	`valid_to` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`discount_value` real NOT NULL,
	`applies_to` text,
	`conditions_json` text,
	`valid_from` text,
	`valid_to` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `alterations` (
	`id` text PRIMARY KEY NOT NULL,
	`work_order_id` text NOT NULL,
	`original_order_id` text,
	`description` text NOT NULL,
	`alteration_type` text NOT NULL,
	`charge` real DEFAULT 0,
	`status` text DEFAULT 'Pending',
	`vendor_id` text,
	`due_date` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`original_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`work_order_id` text NOT NULL,
	`product_id` text,
	`custom_description` text,
	`qty` integer DEFAULT 1 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`customization_notes` text,
	`measurement_id` text,
	`fabric_id` text,
	`fabric_qty` real,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`measurement_id`) REFERENCES `customer_measurements`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fabric_id`) REFERENCES `fabrics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_order_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`work_order_id` text NOT NULL,
	`note` text NOT NULL,
	`is_internal` integer DEFAULT true NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_order_qc_checklist` (
	`id` text PRIMARY KEY NOT NULL,
	`stage_id` text NOT NULL,
	`item` text NOT NULL,
	`is_passed` integer,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`stage_id`) REFERENCES `work_order_stages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_order_stage_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`stage_id` text NOT NULL,
	`photo_path` text NOT NULL,
	`photo_type` text NOT NULL,
	`caption` text,
	`uploaded_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`stage_id`) REFERENCES `work_order_stages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_order_stages` (
	`id` text PRIMARY KEY NOT NULL,
	`work_order_id` text NOT NULL,
	`stage_name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`vendor_id` text,
	`service_tier` text,
	`vendor_cost` real DEFAULT 0,
	`scheduled_date` text,
	`started_at` integer,
	`completed_at` integer,
	`quality_passed` integer,
	`qc_notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_no` text NOT NULL,
	`customer_id` text NOT NULL,
	`category` text NOT NULL,
	`order_type` text DEFAULT 'NEW' NOT NULL,
	`status` text DEFAULT 'New' NOT NULL,
	`priority` text DEFAULT 'Normal' NOT NULL,
	`due_date` text,
	`total_amount` real DEFAULT 0 NOT NULL,
	`discount_amount` real DEFAULT 0 NOT NULL,
	`discount_reason` text,
	`coupon_id` text,
	`tax_amount` real DEFAULT 0 NOT NULL,
	`paid_amount` real DEFAULT 0 NOT NULL,
	`vendor_cost_total` real DEFAULT 0 NOT NULL,
	`profit_amount` real DEFAULT 0 NOT NULL,
	`notes` text,
	`hold_reason` text,
	`hold_resume_date` text,
	`customer_approval_required` integer DEFAULT false,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`method` text NOT NULL,
	`vendor_id` text,
	`staff_id` text,
	`receipt_path` text,
	`expense_date` text NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `installments` (
	`id` text PRIMARY KEY NOT NULL,
	`work_order_id` text NOT NULL,
	`amount` real NOT NULL,
	`due_date` text NOT NULL,
	`paid_at` integer,
	`payment_id` text,
	`status` text DEFAULT 'Pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`work_order_id` text NOT NULL,
	`amount` real NOT NULL,
	`payment_type` text NOT NULL,
	`method` text NOT NULL,
	`reference_no` text,
	`note` text,
	`received_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`received_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vendor_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`work_order_id` text,
	`stage_id` text,
	`service_type` text,
	`amount` real NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`due_date` text,
	`paid_at` integer,
	`paid_by` text,
	`reference_no` text,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stage_id`) REFERENCES `work_order_stages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`paid_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`role` text DEFAULT 'staff' NOT NULL,
	`commission_type` text DEFAULT 'NONE' NOT NULL,
	`commission_value` real DEFAULT 0,
	`joining_date` text,
	`is_active` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `staff_attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`staff_id` text NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `staff_commissions` (
	`id` text PRIMARY KEY NOT NULL,
	`staff_id` text NOT NULL,
	`work_order_id` text,
	`amount` real NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`paid_at` integer,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_sessions_token_hash_unique` ON `user_sessions` (`token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `work_orders_order_no_unique` ON `work_orders` (`order_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);