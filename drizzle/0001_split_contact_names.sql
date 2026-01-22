-- Add first_name and last_name columns (nullable initially)
ALTER TABLE "contacts" ADD COLUMN "first_name" text;
ALTER TABLE "contacts" ADD COLUMN "last_name" text;

-- Split existing name: last word becomes last_name, everything before is first_name
UPDATE "contacts" SET
  "first_name" = CASE
    WHEN position(' ' in "name") > 0
    THEN substring("name" from 1 for length("name") - length(substring("name" from '([^ ]+)$')) - 1)
    ELSE "name"
  END,
  "last_name" = CASE
    WHEN position(' ' in "name") > 0
    THEN substring("name" from '([^ ]+)$')
    ELSE ''
  END;

-- Make columns not null
ALTER TABLE "contacts" ALTER COLUMN "first_name" SET NOT NULL;
ALTER TABLE "contacts" ALTER COLUMN "last_name" SET NOT NULL;

-- Drop the old name column
ALTER TABLE "contacts" DROP COLUMN "name";
