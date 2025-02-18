CREATE TYPE "public"."notification_channel_type" AS ENUM('email', 'sms', 'push', 'slack');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('security', 'system', 'marketing', 'team');--> statement-breakpoint
CREATE TYPE "public"."team_type" AS ENUM('personal', 'workspace');--> statement-breakpoint
CREATE TABLE "db_account" (
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
	CONSTRAINT "db_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "db_api_key" (
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
CREATE TABLE "db_authenticator" (
	"credentialID" text NOT NULL,
	"userId" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "db_authenticator_userId_credentialID_pk" PRIMARY KEY("userId","credentialID"),
	CONSTRAINT "db_authenticator_credentialID_unique" UNIQUE("credentialID")
);
--> statement-breakpoint
CREATE TABLE "db_feedback" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"source" varchar(50) NOT NULL,
	"metadata" text DEFAULT '{}',
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "db_guide_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "db_guide_cross_reference" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_entry_id" integer NOT NULL,
	"target_entry_id" integer NOT NULL,
	"context" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "db_guide_entry" (
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
CREATE TABLE "db_guide_entry_revision" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" integer NOT NULL,
	"content" text NOT NULL,
	"reason" text NOT NULL,
	"contributor_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "db_log" (
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
CREATE TABLE "db_notification_channel" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"type" "notification_channel_type" NOT NULL,
	"enabled" boolean DEFAULT true,
	"configuration" text DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "db_notification_history" (
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
CREATE TABLE "db_notification_preference" (
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
CREATE TABLE "db_notification_template" (
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
CREATE TABLE "db_payment" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"order_id" varchar(255),
	"amount" integer,
	"status" varchar(255) NOT NULL,
	"metadata" text DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "db_permission" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"resource" varchar(255) NOT NULL,
	"action" varchar(255) NOT NULL,
	"attributes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "db_plan" (
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
	CONSTRAINT "db_plan_variantId_unique" UNIQUE("variantId")
);
--> statement-breakpoint
CREATE TABLE "db_post" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256),
	"createdById" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "db_project_member" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"project_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "db_project" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"team_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "db_role_permission" (
	"role_id" varchar(255) NOT NULL,
	"permission_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "db_role_permission_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "db_role" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "db_session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "db_team_member" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"team_id" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "db_team" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "team_type" DEFAULT 'workspace' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "db_temporary_link" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"data" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"type" varchar(50) NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "db_user_file" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"location" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "db_user" (
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
CREATE TABLE "db_verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "db_verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "db_webhook_event" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_name" text NOT NULL,
	"processed" boolean DEFAULT false,
	"body" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "db_account" ADD CONSTRAINT "db_account_userId_db_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."db_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_api_key" ADD CONSTRAINT "db_api_key_user_id_db_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."db_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_api_key" ADD CONSTRAINT "db_api_key_project_id_db_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."db_project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_authenticator" ADD CONSTRAINT "db_authenticator_userId_db_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."db_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_guide_cross_reference" ADD CONSTRAINT "db_guide_cross_reference_source_entry_id_db_guide_entry_id_fk" FOREIGN KEY ("source_entry_id") REFERENCES "public"."db_guide_entry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_guide_cross_reference" ADD CONSTRAINT "db_guide_cross_reference_target_entry_id_db_guide_entry_id_fk" FOREIGN KEY ("target_entry_id") REFERENCES "public"."db_guide_entry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_guide_entry" ADD CONSTRAINT "db_guide_entry_category_id_db_guide_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."db_guide_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_guide_entry" ADD CONSTRAINT "db_guide_entry_contributor_id_db_user_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."db_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_guide_entry_revision" ADD CONSTRAINT "db_guide_entry_revision_entry_id_db_guide_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."db_guide_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_guide_entry_revision" ADD CONSTRAINT "db_guide_entry_revision_contributor_id_db_user_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."db_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_log" ADD CONSTRAINT "db_log_api_key_id_db_api_key_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."db_api_key"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_notification_channel" ADD CONSTRAINT "db_notification_channel_user_id_db_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."db_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_notification_history" ADD CONSTRAINT "db_notification_history_user_id_db_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."db_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_notification_preference" ADD CONSTRAINT "db_notification_preference_user_id_db_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."db_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_post" ADD CONSTRAINT "db_post_createdById_db_user_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."db_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_project_member" ADD CONSTRAINT "db_project_member_project_id_db_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."db_project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_project_member" ADD CONSTRAINT "db_project_member_user_id_db_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."db_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_project" ADD CONSTRAINT "db_project_team_id_db_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."db_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_role_permission" ADD CONSTRAINT "db_role_permission_role_id_db_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."db_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_role_permission" ADD CONSTRAINT "db_role_permission_permission_id_db_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."db_permission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_session" ADD CONSTRAINT "db_session_userId_db_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."db_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_team_member" ADD CONSTRAINT "db_team_member_user_id_db_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."db_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_team_member" ADD CONSTRAINT "db_team_member_team_id_db_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."db_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_temporary_link" ADD CONSTRAINT "db_temporary_link_user_id_db_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."db_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_user_file" ADD CONSTRAINT "db_user_file_user_id_db_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."db_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "db_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "guide_entries_search_term_idx" ON "db_guide_entry" USING btree ("search_term");--> statement-breakpoint
CREATE INDEX "guide_entries_search_vector_idx" ON "db_guide_entry" USING btree ("search_vector");--> statement-breakpoint
CREATE INDEX "guide_entries_popularity_idx" ON "db_guide_entry" USING btree ("popularity");--> statement-breakpoint
CREATE INDEX "guide_entries_category_idx" ON "db_guide_entry" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "createdById_idx" ON "db_post" USING btree ("createdById");--> statement-breakpoint
CREATE INDEX "name_idx" ON "db_post" USING btree ("name");--> statement-breakpoint
CREATE INDEX "user_file_user_id_idx" ON "db_user_file" USING btree ("user_id");