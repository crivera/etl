CREATE TABLE "etl_grid_columns" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"path" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"size" integer NOT NULL,
	"data" jsonb NOT NULL,
	"extracted_text" jsonb,
	"schema" jsonb
);
--> statement-breakpoint
ALTER TABLE "etl_templates" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;