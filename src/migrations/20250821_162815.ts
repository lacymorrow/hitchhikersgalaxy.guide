import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
   CREATE TYPE "payload"."enum_pages_blocks_hero_style" AS ENUM('default', 'centered', 'split');
  CREATE TYPE "payload"."enum_pages_blocks_content_width" AS ENUM('default', 'wide', 'narrow');
  CREATE TYPE "payload"."enum_pages_blocks_content_background" AS ENUM('none', 'gray', 'accent');
  CREATE TYPE "payload"."enum_pages_blocks_features_layout" AS ENUM('grid', 'list', 'carousel');
  CREATE TYPE "payload"."enum_pages_blocks_features_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "payload"."enum_pages_blocks_testimonials_layout" AS ENUM('grid', 'slider', 'single');
  CREATE TYPE "payload"."enum_pages_blocks_testimonials_background" AS ENUM('none', 'light', 'dark');
  CREATE TYPE "payload"."enum_faqs_category" AS ENUM('general', 'technical', 'pricing', 'support');
  CREATE TYPE "payload"."enum_features_plans" AS ENUM('bones', 'brains');
  CREATE TYPE "payload"."enum_features_category" AS ENUM('core', 'dx', 'backend', 'advanced', 'security', 'devops', 'support');
  CREATE TYPE "payload"."enum_features_badge" AS ENUM('new', 'popular', 'pro');
  CREATE TYPE "payload"."enum_rbac_type" AS ENUM('role', 'permission');
  CREATE TYPE "payload"."enum_rbac_resource" AS ENUM('team', 'project', 'user', 'api_key', 'billing', 'settings');
  CREATE TYPE "payload"."enum_rbac_action" AS ENUM('create', 'read', 'update', 'delete', 'manage');
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."rbac" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"type" "payload"."enum_rbac_type" NOT NULL,
  	"resource" "payload"."enum_rbac_resource",
  	"action" "payload"."enum_rbac_action",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload"."pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"subheading" varchar,
  	"image_id" integer,
  	"cta_text" varchar,
  	"cta_link" varchar,
  	"style" "payload"."enum_pages_blocks_hero_style" DEFAULT 'default',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb NOT NULL,
  	"width" "payload"."enum_pages_blocks_content_width" DEFAULT 'default',
  	"background" "payload"."enum_pages_blocks_content_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"layout" "payload"."enum_pages_blocks_features_layout" DEFAULT 'grid',
  	"columns" "payload"."enum_pages_blocks_features_columns" DEFAULT '3',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"layout" "payload"."enum_pages_blocks_testimonials_layout" DEFAULT 'grid',
  	"background" "payload"."enum_pages_blocks_testimonials_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"features_id" integer,
  	"testimonials_id" integer
  );
  
  CREATE TABLE "payload"."faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" jsonb NOT NULL,
  	"category" "payload"."enum_faqs_category",
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."features_plans" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_features_plans",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."features" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"category" "payload"."enum_features_category" NOT NULL,
  	"badge" "payload"."enum_features_badge",
  	"icon" varchar,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"company" varchar,
  	"testimonial" varchar NOT NULL,
  	"username" varchar,
  	"verified" boolean DEFAULT false,
  	"featured" boolean DEFAULT false,
  	"image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."rbac_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"rbac_id" integer
  );
  
  CREATE TABLE "payload"."vercel_deployments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"team_id" varchar,
  	"project_id" varchar NOT NULL,
  	"deployment_id" varchar NOT NULL,
  	"deployment_dashboard_url" varchar,
  	"deployment_url" varchar,
  	"production_deploy_hook_url" varchar,
  	"project_dashboard_url" varchar,
  	"project_name" varchar NOT NULL,
  	"repository_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"pages_id" integer,
  	"media_id" integer,
  	"faqs_id" integer,
  	"features_id" integer,
  	"testimonials_id" integer,
  	"rbac_id" integer,
  	"vercel_deployments_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"seed_completed" boolean DEFAULT false,
  	"seed_completed_at" timestamp(3) with time zone,
  	"site_title" varchar DEFAULT 'Shipkit',
  	"site_description" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."pages" ADD CONSTRAINT "pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_content" ADD CONSTRAINT "pages_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_features" ADD CONSTRAINT "pages_blocks_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_testimonials" ADD CONSTRAINT "pages_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_rels" ADD CONSTRAINT "pages_rels_features_fk" FOREIGN KEY ("features_id") REFERENCES "payload"."features"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_rels" ADD CONSTRAINT "pages_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "payload"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."features_plans" ADD CONSTRAINT "features_plans_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."features"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."testimonials" ADD CONSTRAINT "testimonials_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."rbac_rels" ADD CONSTRAINT "rbac_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."rbac"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."rbac_rels" ADD CONSTRAINT "rbac_rels_rbac_fk" FOREIGN KEY ("rbac_id") REFERENCES "payload"."rbac"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "payload"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_features_fk" FOREIGN KEY ("features_id") REFERENCES "payload"."features"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "payload"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rbac_fk" FOREIGN KEY ("rbac_id") REFERENCES "payload"."rbac"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vercel_deployments_fk" FOREIGN KEY ("vercel_deployments_id") REFERENCES "payload"."vercel_deployments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE INDEX "rbac_updated_at_idx" ON "payload"."rbac" USING btree ("updated_at");
  CREATE INDEX "rbac_created_at_idx" ON "payload"."rbac" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "payload"."pages" USING btree ("slug");
  CREATE INDEX "pages_meta_meta_image_idx" ON "payload"."pages" USING btree ("meta_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "payload"."pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "payload"."pages" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "payload"."pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "payload"."pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "payload"."pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_image_idx" ON "payload"."pages_blocks_hero" USING btree ("image_id");
  CREATE INDEX "pages_blocks_content_order_idx" ON "payload"."pages_blocks_content" USING btree ("_order");
  CREATE INDEX "pages_blocks_content_parent_id_idx" ON "payload"."pages_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_content_path_idx" ON "payload"."pages_blocks_content" USING btree ("_path");
  CREATE INDEX "pages_blocks_features_order_idx" ON "payload"."pages_blocks_features" USING btree ("_order");
  CREATE INDEX "pages_blocks_features_parent_id_idx" ON "payload"."pages_blocks_features" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_features_path_idx" ON "payload"."pages_blocks_features" USING btree ("_path");
  CREATE INDEX "pages_blocks_testimonials_order_idx" ON "payload"."pages_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "pages_blocks_testimonials_parent_id_idx" ON "payload"."pages_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_testimonials_path_idx" ON "payload"."pages_blocks_testimonials" USING btree ("_path");
  CREATE INDEX "pages_rels_order_idx" ON "payload"."pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "payload"."pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "payload"."pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_features_id_idx" ON "payload"."pages_rels" USING btree ("features_id");
  CREATE INDEX "pages_rels_testimonials_id_idx" ON "payload"."pages_rels" USING btree ("testimonials_id");
  CREATE INDEX "faqs_updated_at_idx" ON "payload"."faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "payload"."faqs" USING btree ("created_at");
  CREATE INDEX "features_plans_order_idx" ON "payload"."features_plans" USING btree ("order");
  CREATE INDEX "features_plans_parent_idx" ON "payload"."features_plans" USING btree ("parent_id");
  CREATE INDEX "features_updated_at_idx" ON "payload"."features" USING btree ("updated_at");
  CREATE INDEX "features_created_at_idx" ON "payload"."features" USING btree ("created_at");
  CREATE INDEX "testimonials_image_idx" ON "payload"."testimonials" USING btree ("image_id");
  CREATE INDEX "testimonials_updated_at_idx" ON "payload"."testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "payload"."testimonials" USING btree ("created_at");
  CREATE INDEX "rbac_rels_order_idx" ON "payload"."rbac_rels" USING btree ("order");
  CREATE INDEX "rbac_rels_parent_idx" ON "payload"."rbac_rels" USING btree ("parent_id");
  CREATE INDEX "rbac_rels_path_idx" ON "payload"."rbac_rels" USING btree ("path");
  CREATE INDEX "rbac_rels_rbac_id_idx" ON "payload"."rbac_rels" USING btree ("rbac_id");
  CREATE INDEX "vercel_deployments_project_id_idx" ON "payload"."vercel_deployments" USING btree ("project_id");
  CREATE INDEX "vercel_deployments_deployment_id_idx" ON "payload"."vercel_deployments" USING btree ("deployment_id");
  CREATE INDEX "vercel_deployments_updated_at_idx" ON "payload"."vercel_deployments" USING btree ("updated_at");
  CREATE INDEX "vercel_deployments_created_at_idx" ON "payload"."vercel_deployments" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_features_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("features_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_rbac_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("rbac_id");
  CREATE INDEX "payload_locked_documents_rels_vercel_deployments_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("vercel_deployments_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
   DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."rbac" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."pages" CASCADE;
  DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."pages_blocks_hero" CASCADE;
  DROP TABLE "payload"."pages_blocks_content" CASCADE;
  DROP TABLE "payload"."pages_blocks_features" CASCADE;
  DROP TABLE "payload"."pages_blocks_testimonials" CASCADE;
  DROP TABLE "payload"."pages_rels" CASCADE;
  DROP TABLE "payload"."faqs" CASCADE;
  DROP TABLE "payload"."features_plans" CASCADE;
  DROP TABLE "payload"."features" CASCADE;
  DROP TABLE "payload"."testimonials" CASCADE;
  DROP TABLE "payload"."rbac_rels" CASCADE;
  DROP TABLE "payload"."vercel_deployments" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TABLE "payload"."settings" CASCADE;
  DROP TYPE "payload"."enum_pages_blocks_hero_style";
  DROP TYPE "payload"."enum_pages_blocks_content_width";
  DROP TYPE "payload"."enum_pages_blocks_content_background";
  DROP TYPE "payload"."enum_pages_blocks_features_layout";
  DROP TYPE "payload"."enum_pages_blocks_features_columns";
  DROP TYPE "payload"."enum_pages_blocks_testimonials_layout";
  DROP TYPE "payload"."enum_pages_blocks_testimonials_background";
  DROP TYPE "payload"."enum_faqs_category";
  DROP TYPE "payload"."enum_features_plans";
  DROP TYPE "payload"."enum_features_category";
  DROP TYPE "payload"."enum_features_badge";
  DROP TYPE "payload"."enum_rbac_type";
  DROP TYPE "payload"."enum_rbac_resource";
  DROP TYPE "payload"."enum_rbac_action";`);
}
