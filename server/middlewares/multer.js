import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // This safely resolves to your server/public directory
    // Adjust the '../public' relative path depending on where your multer.js lives
    const uploadPath = path.join(__dirname, '..', 'public'); 
    
    // Auto-create the directory if it doesn't exist yet so it never fails
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Sanitize filename to strip out spaces/parentheses that disrupt file paths
    const sanitizedName = file.originalname.replace(/\s+/g, '_');
    const filename = Date.now() + "-" + sanitizedName;
    cb(null, filename);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});