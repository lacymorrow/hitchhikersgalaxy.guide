CREATE TYPE "public"."notification_channel_type" AS ENUM('email', 'sms', 'push', 'slack');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('security', 'system', 'marketing', 'team');--> statement-breakpoint
CREATE TYPE "public"."team_type" AS ENUM('personal', 'workspace');--> statement-breakpoint
CREATE TABLE "shipkit_account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "shipkit_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "shipkit_activity_log" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"team_id" varchar(255),
	"user_id" varchar(255),
	"action" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'info' NOT NULL,
	"details" text,
	"metadata" text,
	"ip_address" varchar(255),
	"user_agent" text,
	"resource_id" varchar(255),
	"resource_type" varchar(50),
	"timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipkit_api_key" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"key" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"project_id" varchar(255),
	"name" varchar(255) NOT NULL,
	"description" text,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "shipkit_authenticator" (
	"credentialID" text NOT NULL,
	"userId" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "shipkit_authenticator_userId_credentialID_pk" PRIMARY KEY("userId","credentialID"),
	CONSTRAINT "shipkit_authenticator_credentialID_unique" UNIQUE("credentialID")
);
--> statement-breakpoint
CREATE TABLE "shipkit_feedback" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"source" varchar(50) NOT NULL,
	"metadata" text DEFAULT '{}',
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipkit_guide_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipkit_guide_cross_reference" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_entry_id" integer NOT NULL,
	"target_entry_id" integer NOT NULL,
	"context" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipkit_guide_entry" (
	"id" serial PRIMARY KEY NOT NULL,
	"search_term" text NOT NULL,
	"content" text NOT NULL,
	"category_id" integer,
	"popularity" integer DEFAULT 0 NOT NULL,
	"reliability" integer DEFAULT 42 NOT NULL,
	"danger_level" integer DEFAULT 0 NOT NULL,
	"travel_advice" text,
	"where_to_find" text,
	"what_to_avoid" text,
	"fun_fact" text,
	"advertisement" text,
	"contributor_id" varchar(255),
	"search_vector" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipkit_guide_entry_revision" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" integer NOT NULL,
	"content" text NOT NULL,
	"reason" text NOT NULL,
	"contributor_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipkit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"level" text NOT NULL,
	"message" text NOT NULL,
	"prefix" text,
	"emoji" text,
	"metadata" text,
	"api_key_id" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipkit_notification_channel" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"type" "notification_channel_type" NOT NULL,
	"enabled" boolean DEFAULT true,
	"configuration" text DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipkit_notification_history" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"type" "notification_type" NOT NULL,
	"channel" "notification_channel_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"metadata" text DEFAULT '{}',
	"status" varchar(50) DEFAULT 'sent' NOT NULL,
	"sent_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"delivered_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "shipkit_notification_preference" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"type" "notification_type" NOT NULL,
	"channels" text DEFAULT '[]',
	"quiet_hours_start" time with time zone,
	"quiet_hours_end" time with time zone,
	"timezone" varchar(100) DEFAULT 'UTC',
	"frequency" varchar(50) DEFAULT 'instant',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipkit_notification_template" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "notification_type" NOT NULL,
	"channel" "notification_channel_type" NOT NULL,
	"subject" varchar(255),
	"content" text NOT NULL,
	"variables" text DEFAULT '[]',
	"metadata" text DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipkit_payment" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"orderId" varchar(255),
	"amount" integer,
	"status" varchar(255) NOT NULL,
	"metadata" text DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipkit_permission" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"resource" varchar(255) NOT NULL,
	"action" varchar(255) NOT NULL,
	"attributes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipkit_plan" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"productName" text,
	"variantId" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" text NOT NULL,
	"isUsageBased" boolean DEFAULT false,
	"interval" text,
	"intervalCount" integer,
	"trialInterval" text,
	"trialIntervalCount" integer,
	"sort" integer,
	CONSTRAINT "shipkit_plan_variantId_unique" UNIQUE("variantId")
);
--> statement-breakpoint
CREATE TABLE "shipkit_post" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256),
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipkit_project_member" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"project_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipkit_project" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"team_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipkit_role_permission" (
	"role_id" varchar(255) NOT NULL,
	"permission_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "shipkit_role_permission_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "shipkit_role" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipkit_session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipkit_team_member" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"team_id" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipkit_team" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "team_type" DEFAULT 'workspace' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipkit_temporary_link" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"data" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"type" varchar(50) NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "shipkit_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"image" varchar(255),
	"password" varchar(255),
	"github_username" varchar(255),
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"bio" text,
	"theme" varchar(20) DEFAULT 'system',
	"email_notifications" boolean DEFAULT true,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipkit_verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "shipkit_verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "shipkit_webhook_event" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_name" text NOT NULL,
	"processed" boolean DEFAULT false,
	"body" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shipkit_account" ADD CONSTRAINT "shipkit_account_userId_shipkit_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."shipkit_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_activity_log" ADD CONSTRAINT "shipkit_activity_log_team_id_shipkit_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."shipkit_team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_activity_log" ADD CONSTRAINT "shipkit_activity_log_user_id_shipkit_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shipkit_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_api_key" ADD CONSTRAINT "shipkit_api_key_user_id_shipkit_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shipkit_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_api_key" ADD CONSTRAINT "shipkit_api_key_project_id_shipkit_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."shipkit_project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_authenticator" ADD CONSTRAINT "shipkit_authenticator_userId_shipkit_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."shipkit_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_guide_cross_reference" ADD CONSTRAINT "shipkit_guide_cross_reference_source_entry_id_shipkit_guide_entry_id_fk" FOREIGN KEY ("source_entry_id") REFERENCES "public"."shipkit_guide_entry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_guide_cross_reference" ADD CONSTRAINT "shipkit_guide_cross_reference_target_entry_id_shipkit_guide_entry_id_fk" FOREIGN KEY ("target_entry_id") REFERENCES "public"."shipkit_guide_entry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_guide_entry" ADD CONSTRAINT "shipkit_guide_entry_category_id_shipkit_guide_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."shipkit_guide_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_guide_entry" ADD CONSTRAINT "shipkit_guide_entry_contributor_id_shipkit_user_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."shipkit_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_guide_entry_revision" ADD CONSTRAINT "shipkit_guide_entry_revision_entry_id_shipkit_guide_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."shipkit_guide_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_guide_entry_revision" ADD CONSTRAINT "shipkit_guide_entry_revision_contributor_id_shipkit_user_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."shipkit_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_log" ADD CONSTRAINT "shipkit_log_api_key_id_shipkit_api_key_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."shipkit_api_key"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_notification_channel" ADD CONSTRAINT "shipkit_notification_channel_user_id_shipkit_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shipkit_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_notification_history" ADD CONSTRAINT "shipkit_notification_history_user_id_shipkit_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shipkit_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_notification_preference" ADD CONSTRAINT "shipkit_notification_preference_user_id_shipkit_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shipkit_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_post" ADD CONSTRAINT "shipkit_post_created_by_shipkit_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."shipkit_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_project_member" ADD CONSTRAINT "shipkit_project_member_project_id_shipkit_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."shipkit_project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_project_member" ADD CONSTRAINT "shipkit_project_member_user_id_shipkit_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shipkit_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_project" ADD CONSTRAINT "shipkit_project_team_id_shipkit_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."shipkit_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_role_permission" ADD CONSTRAINT "shipkit_role_permission_role_id_shipkit_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."shipkit_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_role_permission" ADD CONSTRAINT "shipkit_role_permission_permission_id_shipkit_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."shipkit_permission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_session" ADD CONSTRAINT "shipkit_session_userId_shipkit_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."shipkit_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_team_member" ADD CONSTRAINT "shipkit_team_member_user_id_shipkit_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shipkit_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_team_member" ADD CONSTRAINT "shipkit_team_member_team_id_shipkit_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."shipkit_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_temporary_link" ADD CONSTRAINT "shipkit_temporary_link_user_id_shipkit_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shipkit_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "shipkit_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "activity_log_timestamp_idx" ON "shipkit_activity_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "activity_log_category_idx" ON "shipkit_activity_log" USING btree ("category");--> statement-breakpoint
CREATE INDEX "activity_log_severity_idx" ON "shipkit_activity_log" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "activity_log_user_id_idx" ON "shipkit_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_log_team_id_idx" ON "shipkit_activity_log" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "guide_entries_search_term_idx" ON "shipkit_guide_entry" USING btree ("search_term");--> statement-breakpoint
CREATE INDEX "guide_entries_search_vector_idx" ON "shipkit_guide_entry" USING btree ("search_vector");--> statement-breakpoint
CREATE INDEX "guide_entries_popularity_idx" ON "shipkit_guide_entry" USING btree ("popularity");--> statement-breakpoint
CREATE INDEX "guide_entries_category_idx" ON "shipkit_guide_entry" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "created_by_idx" ON "shipkit_post" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "name_idx" ON "shipkit_post" USING btree ("name");