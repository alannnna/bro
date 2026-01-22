-- Add location and notes fields to contacts
ALTER TABLE "contacts" ADD COLUMN "location" text DEFAULT '' NOT NULL;
ALTER TABLE "contacts" ADD COLUMN "notes" text DEFAULT '' NOT NULL;
