// server.js
import express from "express";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const { connectMongo, getDb } = require("./backend/db/mongo");
const { connectSnowflake } = require("./db/snowflake");
const { publishCleanToSnowflake } = require("./backend/services/publishClean");

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

/** ---------- MONGOOSE TEST MODEL (from Luke's) ---------- **/
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number,
});
const User = mongoose.model("User", userSchema);

async function runTestQuery() {
  try {
    const savedUser = await User.create({
      name: "Luke",
      email: "luke@example.com",
      age: 25,
    });
    console.log("Success! Data saved to Atlas:", savedUser);

    const foundUser = await User.findOne({ name: "Luke" });
    console.log("Found user in DB:", foundUser);
  } catch (err) {
    console.error("Test query failed:", err);
  }
}

/** ----------------------------- ROUTES ----------------------------- **/
app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/health/deps", async (req, res) => {
  try {
    // Mongo
    await connectMongo();

    // Snowflake
    await connectSnowflake();

    // Mongoose
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    res.json({
      ok: true,
      mongo: "connected",
      mongoose: "connected",
      snowflake: "connected",
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/publish-clean", async (req, res) => {
  try {
    const {
      docId,
      projectId,
      sourceHash,
      cleanText,
      pageCount,
      approvedBy,
      approvalTime,
      riskSummary,
      redactionEvents,
    } = req.body;

    // Update Mongo "status"
    const db = getDb();
    await db.collection("documents").updateOne(
      { docId },
      {
        $set: { projectId, status: "CLEAN", updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    // Publish to Snowflake
    const out = await publishCleanToSnowflake({
      docId,
      projectId,
      sourceHash,
      cleanText,
      pageCount,
      approvedBy,
      approvalTime,
      riskSummary,
      redactionEvents,
    });

    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/** Optional: trigger the Mongoose test without running on startup */
app.post("/mongo-test", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    await runTestQuery();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/** ---------------------------- STARTUP ----------------------------- **/
(async () => {
  try {
    // Your Mongo native driver connection
    await connectMongo();
    console.log("Connected to Mongo (native driver)!");

    // Mongoose connection (same MONGO_URI)
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB (Mongoose)!");

    // Snowflake connection
    await connectSnowflake();
    console.log("Connected to Snowflake!");

    // If you really want their test to run on startup, uncomment:
    // await runTestQuery();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`API listening on ${PORT}`));
  } catch (e) {
    console.error("Startup failed:", e);
    process.exit(1);
  }
})();