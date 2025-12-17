-- CreateTable
CREATE TABLE "room_fees" (
    "id" TEXT NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "feeName" TEXT NOT NULL,
    "feeNameEn" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JPY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_fees_propertyId_roomId_isActive_idx" ON "room_fees"("propertyId", "roomId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "room_fees_propertyId_roomId_feeName_key" ON "room_fees"("propertyId", "roomId", "feeName");
