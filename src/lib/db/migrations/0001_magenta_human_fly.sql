ALTER TABLE "feeds" DROP CONSTRAINT "feeds_name_unique";--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_user_id_name_unique" UNIQUE("user_id","name");