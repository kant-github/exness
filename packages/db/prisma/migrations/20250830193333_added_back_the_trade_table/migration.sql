-- CreateTable
CREATE TABLE "Trade" (
    "id" SERIAL NOT NULL,
    "trade_time" TIMESTAMPTZ(6) NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DECIMAL(18,8) NOT NULL,
    "quantity" DECIMAL(18,8) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id","trade_time")
);

-- CreateIndex
CREATE INDEX "Trade_symbol_trade_time_idx" ON "Trade"("symbol", "trade_time");
