const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// ✅ FIX 6: Ensure upload directory exists before multer tries to write to it
const uploadDir = 'uploads/knowledge-base/';
fs.mkdirSync(uploadDir, { recursive: true });

// Configure storage for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// ✅ FIX 4: Proper MIME type validation — regex against mimetype string was unreliable
const allowedMimeTypes = [
  'application/pdf',                                                                      // .pdf
  'application/msword',                                                                   // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',             // .docx
  'text/plain',                                                                           // .txt
  'text/csv',                                                                             // .csv
  'application/csv',                                                                      // .csv (alternate)
  'application/vnd.ms-excel',                                                            // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',                  // .xlsx
  'text/markdown',                                                                        // .md
  'text/x-markdown',                                                                      // .md (alternate)
  'application/json',                                                                     // .json
  'text/json'                                                                             // .json (alternate)
];

const allowedExtensions = /\.(pdf|doc|docx|txt|csv|xlsx|md|json)$/i;

const fileFilter = (req, file, cb) => {
  const extValid = allowedExtensions.test(path.extname(file.originalname));
  const mimeValid = allowedMimeTypes.includes(file.mimetype);

  // ✅ Accept if either extension OR mime type matches (handles edge cases)
  if (extValid || mimeValid) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type not supported. Allowed types: pdf, doc, docx, txt, csv, xlsx, md, json`
      ),
      false
    );
  }
};

// Multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
});

module.exports = {
  uploadMiddleware: upload
};