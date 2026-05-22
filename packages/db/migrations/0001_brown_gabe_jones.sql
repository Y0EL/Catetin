CREATE TABLE IF NOT EXISTS "whatsapp_sessions" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"jid" text,
	"creds" jsonb,
	"keys" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"linked_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
