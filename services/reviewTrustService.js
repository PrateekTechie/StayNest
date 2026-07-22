const compromise = require("compromise");

const GENERIC_WORDS = new Set([
  "nice",
  "great",
  "good",
  "amazing",
  "wonderful",
  "excellent",
  "love",
  "loved",
  "beautiful",
  "clean",
  "comfortable",
  "perfect",
  "awesome",
  "recommend",
  "best",
  "fantastic",
  "host",
  "stay",
  "place",
  "room",
  "home",
  "trip",
  "visit",
  "experience",
  "very",
  "really",
  "super",
  "nice",
  "great"
]);

function normalizeText(value) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value).split(" ").filter(Boolean);
}

function getSimilarity(a, b) {
  if (!a || !b) return 0;
  const left = new Set(tokenize(a));
  const right = new Set(tokenize(b));
  if (!left.size || !right.size) return 0;
  const overlap = [...left].filter((word) => right.has(word));
  return overlap.length / Math.max(left.size, right.size);
}

function analyzeReview({ comment, rating, authorReviewCount, recentReviews = [] }) {
  const normalizedComment = normalizeText(comment);
  const words = tokenize(comment);
  const genericMatches = words.filter((word) => GENERIC_WORDS.has(word));
  const shortReview = words.length < 6;
  const repeatedGeneric = genericMatches.length >= 3;
  const suspiciousSentiment = rating >= 5 && (shortReview || repeatedGeneric || /!/.test(comment));

  const copiedReview = recentReviews.some((review) => {
    if (!review || !review.comment) return false;
    return getSimilarity(review.comment, comment) > 0.7;
  });

  const repeatedAuthor = authorReviewCount >= 3;

  let score = 100;
  const reasons = [];

  if (shortReview) {
    score -= 25;
    reasons.push("Short high-rated review");
  }

  if (repeatedGeneric) {
    score -= 20;
    reasons.push("Uses generic praise words");
  }

  if (copiedReview) {
    score -= 30;
    reasons.push("Looks similar to a recent review");
  }

  if (repeatedAuthor) {
    score -= 15;
    reasons.push("The same user posted several reviews");
  }

  if (suspiciousSentiment) {
    score -= 10;
    reasons.push("Sentiment appears overly promotional");
  }

  if (rating <= 2 && normalizedComment.length < 12) {
    score -= 10;
    reasons.push("Very brief low-rated review");
  }

  const trustScore = Math.max(0, Math.min(100, Math.round(score)));
  const trustLabel = trustScore >= 70 ? "Genuine Review" : "Suspicious Review";

  return {
    trustScore,
    trustLabel,
    trustReasons: reasons.length ? reasons : ["Balanced, detailed review"],
  };
}

module.exports = {
  analyzeReview,
};
