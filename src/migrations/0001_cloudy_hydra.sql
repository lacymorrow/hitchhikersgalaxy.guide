CREATE TABLE "shipkit_deployments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_name" text NOT NULL,
	"description" text,
	"github_repo_url" text,
	"github_repo_name" text,
	"vercel_project_id" text,
	"vercel_project_url" text,
	"vercel_deployment_url" text,
	"status" text DEFAULT 'deploying' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shipkit_deployments" ADD CONSTRAINT "shipkit_deployments_user_id_shipkit_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."shipkit_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deployment_user_id_idx" ON "shipkit_deployments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "deployment_status_idx" ON "shipkit_deployments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "deployment_created_at_idx" ON "shipkit_deployments" USING btree ("created_at");