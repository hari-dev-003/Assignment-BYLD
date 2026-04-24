-- CreateEnum
CREATE TYPE "Category" AS ENUM ('ETF', 'MTF', 'BOND', 'STOCK');

-- CreateEnum
CREATE TYPE "AlertKind" AS ENUM ('ABOVE', 'BELOW');

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "riskProfile" TEXT NOT NULL,
    "cashBalance" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "price" DECIMAL(19,4) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holding" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "quantity" DECIMAL(19,4) NOT NULL,
    "avgCost" DECIMAL(19,4) NOT NULL,
    "portfolioId" TEXT NOT NULL,

    CONSTRAINT "Holding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "quantity" DECIMAL(19,4) NOT NULL,
    "price" DECIMAL(19,4) NOT NULL,
    "type" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "kind" "AlertKind" NOT NULL,
    "price" DECIMAL(19,4) NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "portfolioId" TEXT NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_symbol_key" ON "Company"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Holding_portfolioId_symbol_key" ON "Holding"("portfolioId", "symbol");

-- AddForeignKey
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
