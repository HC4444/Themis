const fs = require('fs');
const pdf = require('pdf-parse');

async function getRedacted(filePath) {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'text/plain' });

    // 'document' must match the name in upload.single('document')
    formData.append('document', blob, 'ex.txt');

    const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    console.log("API Response:", JSON.stringify(data, null, 2));
    return data;
}



/**
 * Converts a PDF file to a .txt file
 * @param {string} inputPath - Path to the source PDF
 * @param {string} outputPath - Path where the .txt should be saved
 */
async function convertPdfToText(inputPath, outputPath) {
    try {
        // 1. Read the PDF file into a buffer
        const dataBuffer = fs.readFileSync(inputPath);

        // 2. Parse the PDF
        // pdf-parse returns an object containing text, metadata, etc.
        const data = await pdf(dataBuffer);

        // 3. Write the extracted text to a new file
        fs.writeFileSync(outputPath, data.text, 'utf8');

        console.log(`Success! PDF text saved to: ${outputPath}`);
        console.log(`Extracted ${data.numpages} pages.`);

        return data.text;
    } catch (error) {
        console.error("Conversion Error:", error.message);
        throw error;
    }
}

// --- Usage Example ---
// convertPdfToText('./legal_transcript.pdf', './extracted_text.txt');
getRedacted('ex.txt');

function redactPDF(pdfPath) {
    textPath = 'submitted'
    convertPdfToText(pdfPath, textPath );
    return getRedacted(textPath);
}

