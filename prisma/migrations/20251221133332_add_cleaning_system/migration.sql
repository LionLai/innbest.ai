-- CreateEnum
CREATE TYPE "CleaningUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CleaningStatus" AS ENUM ('PENDING', 'NOTIFIED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DAILY', 'WEEKLY', 'IMMEDIATE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('WECHAT_WORK', 'DISCORD', 'EMAIL', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'RETRYING');

-- CreateTable
CREATE TABLE "cleaning_teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "propertyIds" INTEGER[],
    "notificationChannels" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cleaning_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cleaning_tasks" (
    "id" TEXT NOT NULL,
    "beds24BookingId" INTEGER NOT NULL,
    "bookingId" TEXT,
    "propertyId" INTEGER NOT NULL,
    "propertyName" TEXT NOT NULL,
    "roomId" INTEGER NOT NULL,
    "roomName" TEXT NOT NULL,
    "checkOutDate" TIMESTAMP(3) NOT NULL,
    "checkOutTime" TEXT,
    "cleaningDate" TIMESTAMP(3) NOT NULL,
    "nextCheckIn" TIMESTAMP(3),
    "urgency" "CleaningUrgency" NOT NULL,
    "teamId" TEXT,
    "status" "CleaningStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cleaning_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cleaning_notifications" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "teamId" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "taskCount" INTEGER NOT NULL DEFAULT 0,
    "status" "NotificationStatus" NOT NULL,
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cleaning_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cleaning_teams_propertyIds_idx" ON "cleaning_teams"("propertyIds");

-- CreateIndex
CREATE UNIQUE INDEX "cleaning_tasks_beds24BookingId_key" ON "cleaning_tasks"("beds24BookingId");

-- CreateIndex
CREATE INDEX "cleaning_tasks_beds24BookingId_idx" ON "cleaning_tasks"("beds24BookingId");

-- CreateIndex
CREATE INDEX "cleaning_tasks_cleaningDate_idx" ON "cleaning_tasks"("cleaningDate");

-- CreateIndex
CREATE INDEX "cleaning_tasks_status_idx" ON "cleaning_tasks"("status");

-- CreateIndex
CREATE INDEX "cleaning_tasks_teamId_idx" ON "cleaning_tasks"("teamId");

-- CreateIndex
CREATE INDEX "cleaning_notifications_teamId_idx" ON "cleaning_notifications"("teamId");

-- CreateIndex
CREATE INDEX "cleaning_notifications_notificationType_idx" ON "cleaning_notifications"("notificationType");

-- CreateIndex
CREATE INDEX "cleaning_notifications_sentAt_idx" ON "cleaning_notifications"("sentAt");

-- AddForeignKey
ALTER TABLE "cleaning_tasks" ADD CONSTRAINT "cleaning_tasks_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cleaning_tasks" ADD CONSTRAINT "cleaning_tasks_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "cleaning_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cleaning_notifications" ADD CONSTRAINT "cleaning_notifications_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "cleaning_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
