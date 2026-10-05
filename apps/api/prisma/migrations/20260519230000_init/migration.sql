CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "displayAlias" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'adult',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChildProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "avatarId" TEXT,
  "alias" TEXT NOT NULL,
  "age" INTEGER NOT NULL,
  "ageBand" TEXT NOT NULL,
  "nativeLanguage" TEXT NOT NULL DEFAULT 'es',
  "targetLanguage" TEXT NOT NULL DEFAULT 'en',
  "level" TEXT NOT NULL DEFAULT 'starter',
  "xpTotal" INTEGER NOT NULL DEFAULT 0,
  "streakDays" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Avatar" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "personality" TEXT NOT NULL,
  "style" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Avatar_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Mission" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "ageBand" TEXT NOT NULL,
  "xpReward" INTEGER NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConversationSession" (
  "id" TEXT NOT NULL,
  "childProfileId" TEXT NOT NULL,
  "avatarId" TEXT,
  "missionId" TEXT,
  "mode" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "xpEarned" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),

  CONSTRAINT "ConversationSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConversationTurn" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "correctionNeeded" BOOLEAN NOT NULL DEFAULT false,
  "xpAwarded" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ConversationTurn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Badge" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "xpRequired" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "XpEvent" (
  "id" TEXT NOT NULL,
  "childProfileId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "XpEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiProviderConfig" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "providerType" TEXT NOT NULL,
  "baseUrl" TEXT,
  "model" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AiProviderConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SafetyEvent" (
  "id" TEXT NOT NULL,
  "childProfileId" TEXT,
  "sessionId" TEXT,
  "reason" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'info',
  "inputSnippet" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SafetyEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "ChildProfile_userId_alias_key" ON "ChildProfile"("userId", "alias");
CREATE UNIQUE INDEX "Avatar_code_key" ON "Avatar"("code");
CREATE UNIQUE INDEX "Mission_code_key" ON "Mission"("code");
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");
CREATE UNIQUE INDEX "AiProviderConfig_userId_providerType_key" ON "AiProviderConfig"("userId", "providerType");

ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "Avatar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationSession" ADD CONSTRAINT "ConversationSession_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "Avatar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConversationSession" ADD CONSTRAINT "ConversationSession_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationSession" ADD CONSTRAINT "ConversationSession_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConversationTurn" ADD CONSTRAINT "ConversationTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ConversationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "XpEvent" ADD CONSTRAINT "XpEvent_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiProviderConfig" ADD CONSTRAINT "AiProviderConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SafetyEvent" ADD CONSTRAINT "SafetyEvent_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SafetyEvent" ADD CONSTRAINT "SafetyEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ConversationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
