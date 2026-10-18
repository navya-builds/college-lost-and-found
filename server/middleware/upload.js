const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG or WEBP images are allowed."));
        }
    }
});

// Form ke "image" naam ke field se ek photo leta hai
function uploadImage(req, res, next) {
    upload.single("image")(req, res, error => {
        if (error) {
            const message =
                error.code === "LIMIT_FILE_SIZE"
                    ? "Image must be smaller than 5 MB."
                    : error.message || "Image upload failed.";

            return res.status(400).json({ message });
        }

        next();
    });
}

module.exports = { uploadImage };