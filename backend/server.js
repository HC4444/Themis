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

/** -- Knowledge Tree Model -- **/
const EntitySchema = new Schema({
  // Using a String for _id allows for "Normalized Names" (e.g., "John Doe")
  _id: { type: String, required: true },
  type: {
    type: String,
    enum: ['Person', 'Organization', 'Location', 'Case', 'Date', 'Financial'],
    required: true
  },
  attributes: {
    role: String,           // e.g., "Plaintiff", "Witness"
    confidence: Number,     // How sure the LLM is about this entity
    isPII: { type: Boolean, default: false }
  },
  relationships: {
    // This is the core of your graph
    outbound: [{
      target_id: { type: String, ref: 'Entity' }, // Connects to another _id
      predicate: String,                          // e.g., "SPOUSE_OF", "WORKS_FOR"
      source_doc: String                          // Tracking where we found this link
    }]
  },
  redaction: {
    status: { type: String, enum: ['Visible', 'Redacted', 'Flagged'], default: 'Visible' },
    replacement: String    // e.g., "[PLAINTIFF_A]"
  }
}, { timestamps: true });

// CRITICAL: Index the target_id for the $graphLookup operator to work fast
EntitySchema.index({ "relationships.outbound.target_id": 1 });

const Entity = mongoose.model('Entity', EntitySchema);
module.exports = Entity;

async function getCaseNetwork(caseId) {
  return await Entity.aggregate([
    { $match: { _id: caseId } }, // Start at the Case node
    {
      $graphLookup: {
        from: 'entities',               // The collection name
        startWith: '$relationships.outbound.target_id',
        connectFromField: 'relationships.outbound.target_id',
        connectToField: '_id',
        as: 'connectedEntities',
        maxDepth: 2                     // Find "friends of friends"
      }
    }
  ]);
}

function create_node() {

}

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