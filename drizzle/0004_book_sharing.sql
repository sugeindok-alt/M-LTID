CREATE TABLE "named_books" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"recipe_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"published_at" timestamp with time zone,
	"published_title" text,
	"published_description" text
);
--> statement-breakpoint
CREATE TABLE "shared_book_recipes" (
	"book_id" text NOT NULL,
	"recipe_id" text NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"servings" integer NOT NULL,
	"ingredients" jsonb NOT NULL,
	"steps" jsonb NOT NULL,
	"image_webp" text,
	CONSTRAINT "shared_book_recipes_book_id_recipe_id_pk" PRIMARY KEY("book_id","recipe_id")
);
--> statement-breakpoint
ALTER TABLE "named_books" ADD CONSTRAINT "named_books_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_book_recipes" ADD CONSTRAINT "shared_book_recipes_book_id_named_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."named_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "named_books_owner_idx" ON "named_books" USING btree ("user_id");
--> statement-breakpoint
INSERT INTO named_books (id,user_id,title,recipe_ids)
SELECT gen_random_uuid()::text, user_id, 'Mi første kokebok', jsonb_agg(id ORDER BY updated_at, id)
FROM cookbook_recipes GROUP BY user_id;
