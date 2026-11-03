CREATE TABLE "week_dinners" (
	"user_id" text NOT NULL,
	"week_start" date NOT NULL,
	"day" integer NOT NULL,
	"recipe_id" text NOT NULL,
	"servings" integer NOT NULL,
	CONSTRAINT "week_dinners_user_id_week_start_day_pk" PRIMARY KEY("user_id","week_start","day"),
	CONSTRAINT "week_dinners_day_range" CHECK ("week_dinners"."day" between 0 and 6),
	CONSTRAINT "week_dinners_portions_range" CHECK ("week_dinners"."servings" between 1 and 12),
	CONSTRAINT "week_dinners_monday" CHECK (extract(isodow from "week_dinners"."week_start") = 1)
);
--> statement-breakpoint
ALTER TABLE "week_dinners" ADD CONSTRAINT "week_dinners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "week_dinners" ADD CONSTRAINT "week_dinners_recipe_id_recipe_catalog_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe_catalog"("id") ON DELETE no action ON UPDATE no action;