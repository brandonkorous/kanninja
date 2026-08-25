ALTER TABLE "cards" ADD COLUMN "start_date" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "cards_list_id_due_date_idx" ON "cards" USING btree ("list_id","due_date");--> statement-breakpoint
CREATE INDEX "cards_list_id_start_date_idx" ON "cards" USING btree ("list_id","start_date");