CREATE TABLE "cookbook_recipes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"original_id" text,
	"title" text NOT NULL,
	"servings" integer NOT NULL,
	"ingredients" jsonb NOT NULL,
	"steps" jsonb NOT NULL,
	"image_webp" text,
	"revision" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cookbook_owner_id" UNIQUE("user_id","id"),
	CONSTRAINT "cookbook_servings" CHECK ("cookbook_recipes"."servings" between 1 and 24)
);
--> statement-breakpoint
ALTER TABLE "week_dinners" ALTER COLUMN "recipe_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "week_dinners" ADD COLUMN "cookbook_id" text;--> statement-breakpoint
ALTER TABLE "cookbook_recipes" ADD CONSTRAINT "cookbook_recipes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbook_recipes" ADD CONSTRAINT "cookbook_recipes_original_id_recipe_catalog_id_fk" FOREIGN KEY ("original_id") REFERENCES "public"."recipe_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "week_dinners" ADD CONSTRAINT "week_dinners_cookbook_owner_fk" FOREIGN KEY ("user_id","cookbook_id") REFERENCES "public"."cookbook_recipes"("user_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "week_dinners" ADD CONSTRAINT "week_dinners_one_recipe" CHECK (num_nonnulls("week_dinners"."recipe_id", "week_dinners"."cookbook_id") = 1);