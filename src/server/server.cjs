const express = require('express');
const multer = require('multer');
const cors = require('cors');
const libre = require('libreoffice-convert');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 5000;

// Enable CORS so React can talk to this server
app.use(cors());

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.post('/convert', upload.single('file'), (req, res) => {
  const file = req.file;
  
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  // Read the uploaded file
  const inputPath = file.path;
  const outputPath = path.join('uploads', `${file.filename}.pdf`);
  const fileBuffer = fs.readFileSync(inputPath);

  // Convert settings
  const extend = '.pdf';

  // Perform Conversion
  libre.convert(fileBuffer, extend, undefined, (err, done) => {
    if (err) {
      console.error(`Error converting file: ${err}`);
      return res.status(500).send('Error during conversion');
    }

    // Write the PDF to disk (optional, mostly for debugging)
    fs.writeFileSync(outputPath, done);

    // Send the PDF buffer back to the client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=converted.pdf');
    res.send(done);

    // Cleanup: Delete temporary files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});