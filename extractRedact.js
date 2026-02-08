const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files

// 1. Setup API Client
const GEMINI_API_KEY = "AIzaSyAdMIvGNU2nurZGuEuidqeoWYf0HC1Hp64";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const systemInstruction = `
You are an expert Trauma-Informed Legal Redactor. Your goal is to protect survivor anonymity.
Analyze text for 'Identity Clusters' including:
1. Direct PII (Names, SSNs, exact addresses).
2. Quasi-Identifiers: Job titles, unique physical traits, or landmarks that could re-identify someone.

For every risk found, provide:
- 'original_text': The text to hide.
- 'category': Why it's a risk (e.g., 'Quasi-Identifier').
- 'vague_ifier': A safer replacement.
- 'reason': Brief explanation of the risk.

Output must be ONLY a valid JSON object.
`;

// 2. The API Endpoint
app.post('/api/analyze', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded. Use field name 'document'." });
        }

        // Read the text from the uploaded file
        const textContent = fs.readFileSync(req.file.path, 'utf8');

        // Call Gemini (using your logic that already works)
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ role: "user", parts: [{ text: textContent }] }],
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json"
            }
        });

        // 3. Cleanup: Delete the temporary file from /uploads
        fs.unlinkSync(req.file.path);

        // Send JSON back to frontend
        const result = JSON.parse(response.text);
        res.json(result);

    } catch (error) {
        console.error("API Error:", error);
        // Cleanup if file exists but analysis failed
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: "Analysis failed: " + error.message });
    }
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
    console.log(`Server running on http://localhost:${PORT}`);
});