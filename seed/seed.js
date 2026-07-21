const path = require("path");
const readline = require("readline/promises");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const User = require("../models/user");
const Listing = require("../models/listing");
const Review = require("../models/review");
const { getSeedConfig } = require("./config");
const { generateHosts } = require("./hostGenerator");
const { generateListings } = require("./listingGenerator");
const { generateReviewsForListings } = require("./reviewGenerator");

async function promptForConfirmation(question) {
  if (!process.stdin.isTTY) {
    return true;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(`${question} (y/N): `)).trim().toLowerCase();
  rl.close();
  return answer === "y" || answer === "yes";
}

async function main() {
  const args = process.argv.slice(2);
  const countArg = args[0] ? Number(args[0]) : null;
  const modeArg = args[1] || null;

  const config = getSeedConfig({
    count: countArg || undefined,
    mode: modeArg || undefined,
  });

  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.ATLASDB_URL);
  console.log("Database:", mongoose.connection.name);
  console.log("Connected.");
  console.log("Database:", mongoose.connection.name);
console.log("Collections:", await mongoose.connection.db.listCollections().toArray());

const users = await User.find({});
console.log("Users from User model:", users);

const rawUsers = await mongoose.connection.db.collection("users").find({}).toArray();
console.log("Users from raw MongoDB:", rawUsers);
  console.log("Database:", mongoose.connection.name);

  // Keep your own account
  // const myAccount = await User.findOne({
  //   email: "prateek@gmail.com",
  // });

  // if (!myAccount) {
  //   throw new Error("Your account was not found. Check the email.");
  // }

  if (config.mode === "reset") {
    const confirmed = await promptForConfirmation(
      "This will delete all listings, reviews, and generated users. Continue?"
    );

    if (!confirmed) {
      console.log("Seed cancelled.");
      await mongoose.disconnect();
      return;
    }

    console.log("Deleting existing data...");

    await Promise.all([
      Listing.deleteMany({}),
      Review.deleteMany({}),
      User.deleteMany({
        _id: { $ne: myAccount._id },
      }),
    ]);
  }

  else if (config.mode === "delete") {
    const confirmed = await promptForConfirmation(
      "This will delete demo data only. Continue?"
    );

    if (!confirmed) {
      console.log("Seed cancelled.");
      await mongoose.disconnect();
      return;
    }

    console.log("Deleting demo data...");

    await Promise.all([
      Listing.deleteMany({}),
      Review.deleteMany({}),
      User.deleteMany({
        _id: { $ne: myAccount._id },
      }),
    ]);
  }

  console.log(`Generating ${config.numberOfListings} listings...`);

  console.log("Generating hosts...");
  const hosts = await generateHosts(config.hostCount, config.password);

  console.log("Generating listings...");
  const listings = await generateListings(config.numberOfListings, hosts);

  console.log("Generating reviews...");
  await generateReviewsForListings(listings, hosts);

  console.log(
    `Completed successfully. Seeded ${config.numberOfListings} listings.`
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
