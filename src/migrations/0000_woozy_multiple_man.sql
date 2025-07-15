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
CREATE TABLE "shipkit_credit_transaction" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
CREATE TABLE "shipkit_payment" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"order_id" varchar(255),
	"processor_order_id" varchar(255),
	"amount" integer,
	"status" varchar(255) NOT NULL,
	"processor" varchar(50),
	"product_name" text,
	"is_free_product" boolean DEFAULT false,
	"metadata" text DEFAULT '{}',
	"purchased_at" timestamp with time zone,
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
	"createdById" varchar(255) NOT NULL,
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
CREATE TABLE "shipkit_user_credit" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "shipkit_user_credit_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "shipkit_user_file" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"location" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
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
	"metadata" text,
	"vercel_connection_attempted_at" timestamp with time zone,
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
CREATE TABLE "shipkit_waitlist_entry" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"company" varchar(255),
	"role" varchar(100),
	"project_type" varchar(100),
	"timeline" varchar(100),
	"interests" text,
	"is_notified" boolean DEFAULT false,
	"notified_at" timestamp with time zone,
	"source" varchar(50) DEFAULT 'website',
	"metadata" text DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "shipkit_waitlist_entry_email_unique" UNIQUE("email")
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
ALTER TABLE "shipkit_api_key" ADD CONSTRAINT "shipkit_api_key_user_id_shipkit_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shipkit_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_api_key" ADD CONSTRAINT "shipkit_api_key_project_id_shipkit_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."shipkit_project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_authenticator" ADD CONSTRAINT "shipkit_authenticator_userId_shipkit_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."shipkit_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_credit_transaction" ADD CONSTRAINT "shipkit_credit_transaction_user_id_shipkit_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shipkit_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_post" ADD CONSTRAINT "shipkit_post_createdById_shipkit_user_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."shipkit_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_project_member" ADD CONSTRAINT "shipkit_project_member_project_id_shipkit_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."shipkit_project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_project_member" ADD CONSTRAINT "shipkit_project_member_user_id_shipkit_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shipkit_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_project" ADD CONSTRAINT "shipkit_project_team_id_shipkit_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."shipkit_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_role_permission" ADD CONSTRAINT "shipkit_role_permission_role_id_shipkit_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."shipkit_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_role_permission" ADD CONSTRAINT "shipkit_role_permission_permission_id_shipkit_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."shipkit_permission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_session" ADD CONSTRAINT "shipkit_session_userId_shipkit_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."shipkit_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_team_member" ADD CONSTRAINT "shipkit_team_member_user_id_shipkit_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shipkit_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_team_member" ADD CONSTRAINT "shipkit_team_member_team_id_shipkit_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."shipkit_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_temporary_link" ADD CONSTRAINT "shipkit_temporary_link_user_id_shipkit_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shipkit_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_user_credit" ADD CONSTRAINT "shipkit_user_credit_user_id_shipkit_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shipkit_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipkit_user_file" ADD CONSTRAINT "shipkit_user_file_user_id_shipkit_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shipkit_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "shipkit_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "credit_transaction_user_id_idx" ON "shipkit_credit_transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_transaction_type_idx" ON "shipkit_credit_transaction" USING btree ("type");--> statement-breakpoint
CREATE INDEX "createdById_idx" ON "shipkit_post" USING btree ("createdById");--> statement-breakpoint
CREATE INDEX "name_idx" ON "shipkit_post" USING btree ("name");--> statement-breakpoint
CREATE INDEX "user_credit_user_id_idx" ON "shipkit_user_credit" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_file_user_id_idx" ON "shipkit_user_file" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "waitlist_email_idx" ON "shipkit_waitlist_entry" USING btree ("email");--> statement-breakpoint
CREATE INDEX "waitlist_created_at_idx" ON "shipkit_waitlist_entry" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "waitlist_is_notified_idx" ON "shipkit_waitlist_entry" USING btree ("is_notified");