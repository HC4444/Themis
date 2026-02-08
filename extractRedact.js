const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files

// 1. Setup API Client
const GEMINI_API_KEY = "apikey";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const systemInstruction = `
You are an expert Trauma-Informed Legal Redactor. Your goal is to protect survivor anonymity by identifying sensitive data points and "Identity Clusters."

For every risk found, provide a JSON object with these exact keys:
- 'id': A unique incrementing integer starting from 0.
- 'type': The category of the data (e.g., 'name', 'location', 'job', 'date', 'contact').
- 'originalText': The specific text from the source that needs redaction.
- 'suggestedText': A "vague-ified" replacement that preserves context but removes identity (e.g., '[Witness A]' or '[a local business]').
- 'riskLevel': 'high', 'medium', or 'low' based on how easily the info could re-identify the person.
- 'riskReason': A brief explanation of why this specific text is a threat to anonymity.
- 'status': Always set this to 'pending'.

Analyze text for:
1. Direct PII: Names, specific addresses, phone numbers.
2. Quasi-Identifiers: Unique job titles (e.g., "the only female neurosurgeon"), specific landmarks, or intersectional details that, when combined, create a "mosaic effect" to identify a person.

Output must be ONLY a valid JSON array of these objects.
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