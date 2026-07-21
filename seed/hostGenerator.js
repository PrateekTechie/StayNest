const mongoose = require("mongoose");
const User = require("../models/user");
const { pickRandom, createSlug } = require("./utils");

async function generateHosts(count, password) {
  const hosts = [];
  const firstNames = ["Aarav", "Maya", "Riya", "Ananya", "Vikram", "Neha", "Harsh", "Tara", "Priya", "Rohan", "Sanya", "Kabir"];
  const lastNames = ["Sharma", "Patel", "Rao", "Singh", "Kapoor", "Mehta", "Iyer", "Gupta", "Nair", "Malhotra", "Joshi", "Verma"];

  for (let i = 0; i < count; i += 1) {
    const firstName = pickRandom(firstNames);
    const lastName = pickRandom(lastNames);
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i + 1}`;
    const email = `${username}@staynest-demo.com`;

    hosts.push({
      username,
      email,
      password,
    });
  }

  const existing = await User.find({ email: { $in: hosts.map((host) => host.email) } }).select("email");
  const existingEmails = new Set(existing.map((host) => host.email));
  const newHosts = hosts.filter((host) => !existingEmails.has(host.email));

  if (newHosts.length === 0) {
    return User.find({ email: { $in: hosts.map((host) => host.email) } });
  }

  const createdUsers = await Promise.all(
    newHosts.map(async (host) => {
      const user = new User({ email: host.email, username: host.username });
      await User.register(user, host.password);
      return user;
    })
  );

  return createdUsers;
}

module.exports = {
  generateHosts,
};
