-- CreateTable
CREATE TABLE "RawLog" (
    "id" SERIAL NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawLog_pkey" PRIMARY KEY ("id")
);
