-- AlterTable
ALTER TABLE "HealthCheck" ADD COLUMN     "borrowValueUsd" DOUBLE PRECISION,
ADD COLUMN     "collateralValueUsd" DOUBLE PRECISION,
ADD COLUMN     "healthFactor" DOUBLE PRECISION;
