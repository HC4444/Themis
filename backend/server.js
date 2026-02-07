require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectMongo, getDb } = require("./backend/db/mongo");
const { connectSnowflake } = require("./db/snowflake");
const { publishCleanToSnowflake } = require("./backend/services/publishClean");

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/health/deps", async (req, res) => {
  try {
    await connectMongo();
    await connectSnowflake();
    res.json({ ok: true, mongo: "connected", snowflake: "connected" });
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

    // Update Mongo "status" (optional but nice)
    const db = getDb();
    await db.collection("documents").updateOne(
      { docId },
      { $set: { projectId, status: "CLEAN", updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

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

(async () => {
  await connectMongo();
  await connectSnowflake();
  app.listen(process.env.PORT || 8080, () =>
    console.log(`API listening on ${process.env.PORT || 8080}`)
  );
})();
