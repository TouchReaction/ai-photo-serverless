const express = require("express");
const router = express.Router();
const multer = require("multer");
const StorageFactory = require("../storage/StorageFactory");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const storage = StorageFactory.getInstance();
    const filename = await storage.saveFile(req.file);

    res.json({
      success: true,
      filename,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/url/:filename", async (req, res) => {
  try {
    const storage = StorageFactory.getInstance();
    const url = await storage.getFileUrl(req.params.filename);

    res.json({
      success: true,
      url,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: "File not found",
    });
  }
});

module.exports = router;
