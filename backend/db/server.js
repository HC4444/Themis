import express from "express";
import crypto from "crypto";
import dotenv from "dotenv";
import { supabase } from "./supabase.js";

dotenv.config();
const app = express();
app.use(express.json({ limit: "10mb" }));

// SAVE MANIFEST
app.post("/documents/:docId/revisions", async (req, res) => {
  const { docId } = req.params;
  const manifest = req.body.manifest;

  const revisionId = crypto.randomUUID();
  const manifestKey = `${docId}/${revisionId}.json`;

  // Upload manifest JSON
  await supabase.storage
    .from("manifests")
    .upload(
      manifestKey,
      Buffer.from(JSON.stringify(manifest)),
      { contentType: "application/json" }
    );

  // Insert revision row
  await supabase.from("revisions").insert({
    id: revisionId,
    document_id: docId,
    manifest_key: manifestKey
  });

  res.json({ revisionId });
});

// LIST REVISIONS
app.get("/documents/:docId/revisions", async (req, res) => {
  const { docId } = req.params;

  const { data } = await supabase
    .from("revisions")
    .select("*")
    .eq("document_id", docId)
    .order("created_at", { ascending: false });

  res.json(data);
});

app.listen(3000, () => console.log("running on 3000"));
