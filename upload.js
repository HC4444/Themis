// File upload handling
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileList = document.getElementById('fileList');
const actionBar = document.getElementById('actionBar');
const fileCount = document.getElementById('fileCount');
const processBtn = document.getElementById('processBtn');

let selectedFiles = [];

// Browse button click
browseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    fileInput.click();
});

// Upload zone click
uploadZone.addEventListener('click', () => {
    fileInput.click();
});

// File input change
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Drag and drop
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

// Handle files
function handleFiles(files) {
    const validFiles = Array.from(files).filter(file => {
        const validTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        const maxSize = 50 * 1024 * 1024; // 50MB
        
        if (!validTypes.includes(file.type)) {
            alert(`${file.name} is not a supported file type`);
            return false;
        }
        
        if (file.size > maxSize) {
            alert(`${file.name} exceeds the 50MB limit`);
            return false;
        }
        
        return true;
    });
    
    selectedFiles = [...selectedFiles, ...validFiles];
    renderFileList();
}

// Render file list
function renderFileList() {
    fileList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const extension = file.name.split('.').pop().toUpperCase();
        const size = formatFileSize(file.size);
        
        fileItem.innerHTML = `
            <div class="file-icon">${extension}</div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${size}</div>
            </div>
            <button class="file-remove" onclick="removeFile(${index})">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        `;
        
        fileList.appendChild(fileItem);
    });
    
    // Update action bar
    if (selectedFiles.length > 0) {
        actionBar.style.display = 'flex';
        fileCount.textContent = selectedFiles.length;
    } else {
        actionBar.style.display = 'none';
    }
}

// Remove file
function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Process files
processBtn.addEventListener('click', () => {
    if (selectedFiles.length === 0) {
        alert('Please select at least one file');
        return;
    }
    
    // Store files in sessionStorage and redirect to editor
    const fileData = selectedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
    }));
    
    sessionStorage.setItem('aegis-files', JSON.stringify(fileData));
    
    // In production, you would upload files here via FormData
    // For demo purposes, we'll just navigate to the editor
    window.location.href = 'editor.html';
});

// Make removeFile globally accessible
window.removeFile = removeFile;