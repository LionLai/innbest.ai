-- CreateTable
CREATE TABLE "owners" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "phone" TEXT,
    "supabaseUserId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_properties" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "canViewBookings" BOOLEAN NOT NULL DEFAULT true,
    "canViewRevenue" BOOLEAN NOT NULL DEFAULT true,
    "canViewStats" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owner_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_notification_settings" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "emailOnNewBooking" BOOLEAN NOT NULL DEFAULT true,
    "emailOnCancellation" BOOLEAN NOT NULL DEFAULT true,
    "emailWeeklyReport" BOOLEAN NOT NULL DEFAULT true,
    "emailMonthlyReport" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owner_notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "owners_email_key" ON "owners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "owners_supabaseUserId_key" ON "owners"("supabaseUserId");

-- CreateIndex
CREATE INDEX "owners_email_idx" ON "owners"("email");

-- CreateIndex
CREATE INDEX "owners_isActive_idx" ON "owners"("isActive");

-- CreateIndex
CREATE INDEX "owner_properties_ownerId_idx" ON "owner_properties"("ownerId");

-- CreateIndex
CREATE INDEX "owner_properties_propertyId_idx" ON "owner_properties"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "owner_properties_ownerId_propertyId_key" ON "owner_properties"("ownerId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "owner_notification_settings_ownerId_key" ON "owner_notification_settings"("ownerId");

-- AddForeignKey
ALTER TABLE "owner_properties" ADD CONSTRAINT "owner_properties_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_notification_settings" ADD CONSTRAINT "owner_notification_settings_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
