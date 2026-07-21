const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

function getSeedConfig(overrides = {}) {
  const requestedCount = Number(overrides.count || process.env.SEED_LISTINGS || 100);
  const safeCount = Number.isFinite(requestedCount) && requestedCount > 0 ? Math.floor(requestedCount) : 100;

  return {
    numberOfListings: safeCount,
    hostCount: Math.max(12, Math.min(200, Math.ceil(safeCount / 6))),
    reviewsPerListing: { min: 2, max: 6 },
    password: process.env.SEED_PASSWORD || "staynest123",
    mode: overrides.mode || process.env.SEED_MODE || "append",
    batchSize: 500,
  };
}

module.exports = {
  getSeedConfig,
};
