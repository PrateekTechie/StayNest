const path = require("path");
const fs = require("fs");

function loadJson(fileName) {
  const filePath = path.join(__dirname, fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function pickRandomCount(items, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function createPrice(base, variance = 0.2) {
  const spread = base * variance;
  return Math.round((base + (Math.random() * spread * 2 - spread)) / 100) * 100;
}

function createDate(daysAgo = 30) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

module.exports = {
  loadJson,
  pickRandom,
  pickRandomCount,
  createSlug,
  createPrice,
  createDate,
};
