const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");

// Ensure the uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// Initialize Multer
const upload = multer({
    storage: storage, 
});

// Middleware to compress image to exactly 200KB
const processImage = async (req, res, next) => {

    console.log("Processing image...");
    if (!req.file) return next();

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const outputFilePath = path.join(uploadDir, "c-" + req.file.filename);
    const targetSize = 200 * 1024; // 200KB in bytes

    try {

        if (!fs.existsSync(filePath)) {
            console.error("File not found:", filePath);
            return res.status(400).json({ error: "File not found" });
        }

        if (req.file.size > 1 * 2024 * 1024) {
            console.log("File size exceeds 1MB, skipping compression.");
            fs.unlinkSync(filePath); // Only delete if file size exceeds 1MB
            return res.status(400).json({ error: "File size exceeds 1MB" });
        }

        let fileSize = fs.statSync(filePath).size;

        if (fileSize <= targetSize) {
            console.log("File already under 200KB, skipping compression.");
            return next(); // Skip if already <= 200KB
        }

        if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
            let quality = 90;
            let image = sharp(filePath);
            let outputBuffer = await image.toBuffer();

            let minQuality = 10;
            let maxQuality = 90;

            while (Math.abs(outputBuffer.length - targetSize) > 1024 && minQuality <= maxQuality) {
                quality = Math.floor((minQuality + maxQuality) / 2);
                outputBuffer = await image.toFormat(ext === ".png" ? "png" : ext === ".webp" ? "webp" : "jpeg", { quality }).toBuffer();
                fileSize = outputBuffer.length;

                if (fileSize > targetSize) {
                    maxQuality = quality - 1;
                } else {
                    minQuality = quality + 1;
                }
            }

            await sharp(outputBuffer).toFile(outputFilePath);
        } else {
            let fileBuffer = fs.readFileSync(filePath);
            let compressedBuffer = zlib.gzipSync(fileBuffer, { level: 9 });

            if (compressedBuffer.length > targetSize) {
                compressedBuffer = compressedBuffer.slice(0, targetSize);
            }

            fs.writeFileSync(outputFilePath, compressedBuffer);
        }

        // Delete the original file only after processing
        fs.unlinkSync(filePath);

        // Update request file info
        req.file.path = outputFilePath;
        req.file.filename = "c-" + req.file.filename;
        req.file.size = targetSize; // Store the exact new size

        next();
    } catch (err) {
        console.error("Error processing file:", err);
        next(err);
    }
};

// Add a separate upload function for categories
const categoryUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = path.join(__dirname, '../uploads/categories');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  }
});

// Then export it alongside your existing upload middleware
module.exports = { 
  upload,
  processImage,
  categoryUpload
};
