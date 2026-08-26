-- Step 1: Add column as nullable
ALTER TABLE "cards" ADD COLUMN "created_by" uuid;--> statement-breakpoint

-- Step 2: Backfill from board owner via lists
UPDATE "cards"
SET "created_by" = (
  SELECT "boards"."user_id"
  FROM "boards"
  INNER JOIN "lists" ON "lists"."board_id" = "boards"."id"
  WHERE "lists"."id" = "cards"."list_id"
);--> statement-breakpoint

-- Step 3: Set NOT NULL constraint
ALTER TABLE "cards" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint

-- Step 4: Add FK constraint
ALTER TABLE "cards" ADD CONSTRAINT "cards_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
