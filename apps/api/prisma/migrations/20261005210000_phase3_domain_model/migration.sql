BEGIN;

-- Preserve mission IDs and convert existing age ranges before removing ageBand.
ALTER TABLE "Mission" ADD COLUMN "minAge" INTEGER, ADD COLUMN "maxAge" INTEGER;
UPDATE "Mission"
SET "minAge" = CASE
      WHEN "code" IN ('meet-a-new-friend', 'animal-adventure') THEN 5
      WHEN "code" IN ('ice-cream-shop', 'space-explorer') THEN 8
      WHEN "ageBand" ~ '^[0-9]{1,2}-[0-9]{1,2}$' THEN split_part("ageBand", '-', 1)::INTEGER
    END,
    "maxAge" = CASE
      WHEN "code" = 'meet-a-new-friend' THEN 7
      WHEN "code" = 'animal-adventure' THEN 10
      WHEN "code" IN ('ice-cream-shop', 'space-explorer') THEN 12
      WHEN "ageBand" ~ '^[0-9]{1,2}-[0-9]{1,2}$' THEN split_part("ageBand", '-', 2)::INTEGER
    END;
-- Invalid custom ranges fail atomically rather than silently changing eligibility.
ALTER TABLE "Mission"
  ALTER COLUMN "minAge" SET NOT NULL,
  ALTER COLUMN "maxAge" SET NOT NULL,
  DROP COLUMN "ageBand",
  ADD CONSTRAINT "Mission_age_range_check" CHECK ("minAge" >= 5 AND "maxAge" <= 12 AND "minAge" <= "maxAge");

ALTER TABLE "ConversationSession"
  ADD COLUMN "missionProgress" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "aiProviderType" TEXT,
  ADD COLUMN "aiModel" TEXT,
  ADD CONSTRAINT "ConversationSession_missionProgress_check" CHECK ("missionProgress" BETWEEN 0 AND 100);

ALTER TABLE "ConversationTurn"
  ADD COLUMN "correctedContent" TEXT,
  ADD COLUMN "correctionExplanation" TEXT,
  ADD COLUMN "inputMode" TEXT NOT NULL DEFAULT 'text';

ALTER TABLE "XpEvent" ADD COLUMN "sessionId" TEXT;

CREATE TABLE "ChildBadge" (
  "id" TEXT NOT NULL,
  "childProfileId" TEXT NOT NULL,
  "badgeId" TEXT NOT NULL,
  "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source" TEXT,
  CONSTRAINT "ChildBadge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VocabularyItem" (
  "id" TEXT NOT NULL,
  "childProfileId" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "term" TEXT NOT NULL,
  "normalizedTerm" TEXT NOT NULL,
  "practiceCount" INTEGER NOT NULL DEFAULT 1,
  "successfulUseCount" INTEGER NOT NULL DEFAULT 0,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastPracticedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VocabularyItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VocabularyItem_counts_check" CHECK ("practiceCount" >= 1 AND "successfulUseCount" BETWEEN 0 AND "practiceCount"),
  CONSTRAINT "VocabularyItem_dates_check" CHECK ("firstSeenAt" <= "lastPracticedAt"),
  CONSTRAINT "VocabularyItem_term_check" CHECK (length(btrim("normalizedTerm")) > 0)
);

-- Legacy safety metadata cannot be inferred; discard raw snippets intentionally.
ALTER TABLE "SafetyEvent" ADD COLUMN "category" TEXT, ADD COLUMN "action" TEXT;
UPDATE "SafetyEvent" SET "category" = 'legacy', "action" = 'unknown';
ALTER TABLE "SafetyEvent"
  ALTER COLUMN "category" SET NOT NULL,
  ALTER COLUMN "action" SET NOT NULL,
  DROP COLUMN "inputSnippet";

CREATE UNIQUE INDEX "ChildBadge_childProfileId_badgeId_key" ON "ChildBadge"("childProfileId", "badgeId");
CREATE INDEX "ChildBadge_childProfileId_idx" ON "ChildBadge"("childProfileId");
CREATE UNIQUE INDEX "VocabularyItem_childProfileId_language_normalizedTerm_key" ON "VocabularyItem"("childProfileId", "language", "normalizedTerm");
CREATE INDEX "VocabularyItem_childProfileId_idx" ON "VocabularyItem"("childProfileId");
CREATE INDEX "ConversationSession_childProfileId_startedAt_idx" ON "ConversationSession"("childProfileId", "startedAt");
CREATE INDEX "ConversationTurn_sessionId_createdAt_idx" ON "ConversationTurn"("sessionId", "createdAt");
CREATE INDEX "XpEvent_sessionId_idx" ON "XpEvent"("sessionId");
CREATE INDEX "XpEvent_childProfileId_createdAt_idx" ON "XpEvent"("childProfileId", "createdAt");

ALTER TABLE "ChildBadge" ADD CONSTRAINT "ChildBadge_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChildBadge" ADD CONSTRAINT "ChildBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VocabularyItem" ADD CONSTRAINT "VocabularyItem_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "XpEvent" ADD CONSTRAINT "XpEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ConversationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
