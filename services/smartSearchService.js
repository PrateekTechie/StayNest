const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sanitizeNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function sanitizeStringArray(value) {
  if (Array.isArray(value)) {
    const filtered = value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0);
    return filtered.length ? filtered : null;
  }
  if (typeof value === "string") {
    const split = value
      .split(/[,;]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    return split.length ? split : null;
  }
  return null;
}

function extractJsonString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  return value.slice(firstBrace, lastBrace + 1);
}

function sanitizeParsedFilters(parsedFilters) {
  if (!parsedFilters || typeof parsedFilters !== "object") {
    return {};
  }

  const filters = {};

  if (isNonEmptyString(parsedFilters.location)) {
    filters.location = parsedFilters.location.trim();
  }

  const minPrice = sanitizeNumber(parsedFilters.minPrice ?? parsedFilters.minimumPrice);
  if (minPrice !== null && minPrice >= 0) {
    filters.minPrice = minPrice;
  }

  const maxPrice = sanitizeNumber(parsedFilters.maxPrice ?? parsedFilters.maximumPrice);
  if (maxPrice !== null && maxPrice >= 0) {
    filters.maxPrice = maxPrice;
  }

  if (isNonEmptyString(parsedFilters.propertyType)) {
    filters.propertyType = parsedFilters.propertyType.trim();
  }

  const amenities = sanitizeStringArray(parsedFilters.amenities);
  if (amenities) {
    filters.amenities = amenities;
  }

  const guests = sanitizeNumber(parsedFilters.guests);
  if (guests !== null && Number.isInteger(guests) && guests > 0) {
    filters.guests = guests;
  }

  if (
    filters.minPrice !== undefined &&
    filters.maxPrice !== undefined &&
    filters.maxPrice < filters.minPrice
  ) {
    delete filters.maxPrice;
  }

  return filters;
}

function parseFiltersLocally(searchText) {
  const text = (searchText || "").trim();
  if (!text) {
    return {};
  }

  const filters = {};
  const normalized = text.toLowerCase();

  const locationMatch = normalized.match(/\b(?:in|at|near|around)\s+([a-z0-9\s-]+?)(?=\s+(?:with|for|under|below|above|max|maximum|minimum|min|upto|up to|budget|and|or|$))/i);
  if (locationMatch) {
    filters.location = locationMatch[1].trim();
  } else if (!/(under|below|upto|up to|max|maximum|minimum|min|above|more than|budget|guests?|people|persons?|house|villa|apartment|flat|hotel|resort|cottage|pool|wifi|parking|gym|breakfast|beach|kitchen|pet|ac|air conditioning)/i.test(normalized)) {
    filters.location = text;
  }

  const propertyTypeMap = [
    { keywords: ["house", "villa", "home"], value: "house" },
    { keywords: ["apartment", "flat", "studio", "condo"], value: "apartment" },
    { keywords: ["hotel", "resort"], value: "hotel" },
    { keywords: ["cottage", "cabin"], value: "cottage" },
  ];

  for (const entry of propertyTypeMap) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      filters.propertyType = entry.value;
      break;
    }
  }

  const amenityMap = [
    { keywords: ["pool"], value: "pool" },
    { keywords: ["wifi", "wi-fi"], value: "wifi" },
    { keywords: ["parking"], value: "parking" },
    { keywords: ["gym"], value: "gym" },
    { keywords: ["breakfast"], value: "breakfast" },
    { keywords: ["beach"], value: "beach" },
    { keywords: ["kitchen"], value: "kitchen" },
    { keywords: ["pet friendly", "pet-friendly"], value: "pet friendly" },
    { keywords: ["ac", "air conditioning"], value: "ac" },
  ];

  const amenities = [];
  for (const entry of amenityMap) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      amenities.push(entry.value);
    }
  }
  if (amenities.length > 0) {
    filters.amenities = amenities;
  }

  const maxPriceMatch = normalized.match(/(?:under|below|upto|up to|max(?:imum)?|budget)\s*\$?\s*(\d+)/i);
  if (maxPriceMatch) {
    filters.maxPrice = Number(maxPriceMatch[1]);
  }

  const minPriceMatch = normalized.match(/(?:above|more than|minimum|min(?:imum)?|from)\s*\$?\s*(\d+)/i);
  if (minPriceMatch) {
    filters.minPrice = Number(minPriceMatch[1]);
  }

  const guestsMatch = normalized.match(/(\d+)\s*(?:guests?|people|persons?)/i);
  if (guestsMatch) {
    filters.guests = Number(guestsMatch[1]);
  }

  return filters;
}

async function parseNaturalLanguageSearch(searchText) {
  const localFilters = parseFiltersLocally(searchText);
  return sanitizeParsedFilters(localFilters);
}

function buildMongoFilterFromSmartSearch(filters) {
  const mongoFilter = {};

  if (isNonEmptyString(filters.location)) {
    mongoFilter.location = {
      $regex: escapeRegex(filters.location),
      $options: "i",
    };
  }

  if (isNonEmptyString(filters.propertyType)) {
    mongoFilter.propertyType = {
      $regex: escapeRegex(filters.propertyType),
      $options: "i",
    };
  }

  if (Array.isArray(filters.amenities) && filters.amenities.length > 0) {
    mongoFilter.amenities = { $all: filters.amenities };
  }

  if (Number.isInteger(filters.guests)) {
    mongoFilter.guests = { $gte: filters.guests };
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    mongoFilter.price = {};
    if (filters.minPrice !== undefined) {
      mongoFilter.price.$gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      mongoFilter.price.$lte = filters.maxPrice;
    }
  }

  return mongoFilter;
}

module.exports = {
  parseNaturalLanguageSearch,
  buildMongoFilterFromSmartSearch,
};
