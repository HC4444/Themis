const crypto = require("crypto");
const { sfExecute } = require("../db/snowflake");

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

async function publishCleanToSnowflake({
  docId,
  projectId,
  sourceHash,
  cleanText,
  pageCount,
  approvedBy,
  approvalTime,
  riskSummary,
  redactionEvents,
}) {
  const cleanHash = sha256(cleanText);

  // Insert CLEAN_DOCUMENTS
  await sfExecute(
    `INSERT INTO CLEAN_DOCUMENTS
     (doc_id, project_id, source_hash, clean_hash, clean_text, page_count, approved_by, approval_time, retention_until)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATEADD('day', 30, CURRENT_TIMESTAMP()))`,
    [docId, projectId, sourceHash, cleanHash, cleanText, pageCount, approvedBy, approvalTime]
  );

  // Score calculation (simple, defensible)
  const score = Math.min(
    100,
    (riskSummary.highRiskClusters * 10) +
      (riskSummary.quasiCount * 2) +
      (riskSummary.unresolvedCount * 15)
  );
  const level = score > 60 ? "HIGH" : score >= 30 ? "MED" : "LOW";

  // Insert RISK_SUMMARY
  await sfExecute(
    `INSERT INTO RISK_SUMMARY
     (doc_id, risk_score, risk_level, high_risk_clusters, total_clusters, quasi_identifier_count, unresolved_count, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      docId,
      score,
      level,
      riskSummary.highRiskClusters,
      riskSummary.totalClusters,
      riskSummary.quasiCount,
      riskSummary.unresolvedCount,
      riskSummary.notes || null,
    ]
  );

  // Insert REDACTION_EVENTS (audit trail)
  for (const ev of redactionEvents || []) {
    await sfExecute(
      `INSERT INTO REDACTION_EVENTS
       (doc_id, entity_type, replacement_type, accepted, confidence, original_snippet_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [docId, ev.entityType, ev.replacementType, ev.accepted, ev.confidence, ev.originalSnippetHash]
    );
  }

  return { docId, cleanHash, riskScore: score, riskLevel: level };
}

module.exports = { publishCleanToSnowflake, sha256 };
