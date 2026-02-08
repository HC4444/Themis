const fs = require('fs');

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

getRedacted('ex.txt');

