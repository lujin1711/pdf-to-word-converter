import React, { useState } from 'react';
import jsPDF from 'jspdf';
import axios from 'axios';

const PdfConverter = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // --- 1. File Selection Handling ---
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setStatusMessage(`${files.length} file(s) selected.`);
  };

  // --- 2. Helper: Read File as Data URL (For Images) ---
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // --- 3. Helper: Process Image (Client-Side) ---
  const processImage = async (file, doc) => {
    const imgData = await readFileAsDataURL(file);
    const imgProps = doc.getImageProperties(imgData);

    // Calculate A4 dimensions (in mm)
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();

    // Scale image to fit within A4 margins
    const margin = 10;
    const maxImgWidth = pdfWidth - (margin * 2);
    const maxImgHeight = pdfHeight - (margin * 2);

    let imgWidth = imgProps.width;
    let imgHeight = imgProps.height;

    // Aspect ratio logic to fit page
    const ratio = Math.min(maxImgWidth / imgWidth, maxImgHeight / imgHeight);
    imgWidth = imgWidth * ratio;
    imgHeight = imgHeight * ratio;

    doc.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
  };

  // --- 4. Helper: Process Word (Server-Side via Axios) ---
  const processWordViaBackend = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setStatusMessage(`Uploading ${file.name} to server...`);

            // Replace localhost with your new Render URL
const response = await axios.post('https://word-to-pdf-converter-1-qyai.onrender.com', formData, { 
    responseType: 'blob' 
});
      
      // Create a download link for the returned PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `converted-${file.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Clean up memory

      return true; // Success flag
    } catch (error) {
      console.error("Conversion failed", error);
      setStatusMessage(`Failed to convert ${file.name}. Check backend connection.`);
      return false; // Failure flag
    }
  };

  // --- 5. Main Conversion Logic ---
  const generatePDF = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select files first!");
      return;
    }

    setIsConverting(true);
    setStatusMessage('Starting conversion process...');

    // Filter files by type
    const imageFiles = selectedFiles.filter(f => f.type.includes('image'));
    const wordFiles = selectedFiles.filter(f => f.name.endsWith('.docx') || f.type.includes('word'));

    // --- A. Handle Images (Client Side - Merged into one PDF) ---
    if (imageFiles.length > 0) {
      try {
        setStatusMessage(`Processing ${imageFiles.length} image(s)...`);
        const doc = new jsPDF('p', 'mm', 'a4');

        for (let i = 0; i < imageFiles.length; i++) {
          if (i > 0) doc.addPage(); // Add new page for subsequent images
          await processImage(imageFiles[i], doc);
        }

        doc.save('merged-images.pdf');
        setStatusMessage('Images converted and downloaded.');
      } catch (err) {
        console.error(err);
        setStatusMessage('Error processing images.');
      }
    }

    // --- B. Handle Word Docs (Server Side - Downloaded individually) ---
    if (wordFiles.length > 0) {
      for (const file of wordFiles) {
        await processWordViaBackend(file);
      }
    }

    setIsConverting(false);
    setStatusMessage('All tasks completed.');
  };

  return (
    <div className="pdf-converter-container" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Image & Word to PDF Converter</h2>

      <div className="upload-section" style={{ marginBottom: '20px' }}>
        <input
          type="file"
          multiple
          accept="image/*, .docx"
          onChange={handleFileChange}
          style={{ padding: '10px' }}
        />
      </div>

      <div className="file-list" style={{ marginBottom: '20px' }}>
        {selectedFiles.length > 0 && (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {selectedFiles.map((file, index) => (
              <li key={index} style={{ background: '#f0f0f0', margin: '5px 0', padding: '5px' }}>
                {file.name} - <strong>{file.type.includes('image') ? 'Image' : 'Word Doc'}</strong> ({(file.size / 1024).toFixed(2)} KB)
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="actions">
        <button
          onClick={generatePDF}
          disabled={isConverting || selectedFiles.length === 0}
          className="convert-btn"
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isConverting ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isConverting ? 'not-allowed' : 'pointer'
          }}
        >
          {isConverting ? 'Processing...' : 'Convert to PDF'}
        </button>
      </div>

      {statusMessage && (
        <p className="status" style={{ marginTop: '15px', fontWeight: 'bold' }}>
          {statusMessage}
        </p>
      )}
    </div>
  );
};

export default PdfConverter;
