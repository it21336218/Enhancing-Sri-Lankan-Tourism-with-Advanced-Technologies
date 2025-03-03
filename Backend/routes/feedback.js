const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const {
  addFeedback,
  getAllFeedbacks,
  getFeedbackById,
  deleteFeedback,
  updateFeedback,
} = require("../services/feedbackService");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.post(
  "/upload",
  authMiddleware,
  upload.fields([{ name: "video" }, { name: "audio" }]),
  async (req, res) => {
    try {
      const { rating, feedback } = req.body;
      const videoPath =
        req.files && req.files.video ? req.files.video[0].path : null;
      const audioPath =
        req.files && req.files.audio ? req.files.audio[0].path : null;

      // if (!rating || !feedback) {
      //   return res
      //     .status(400)
      //     .json({ message: "Rating and feedback are required" });
      // }

      const newFeedback = await addFeedback(
        req.user.id,
        rating,
        feedback,
        videoPath,
        audioPath
      );
      res.status(201).json({
        message: "Feedback added successfully",
        feedback: newFeedback,
      });
    } catch (error) {
      console.error("Error uploading feedback:", error);
      res.status(500).json({
        message: "Error uploading feedback",
        error: error.message || error,
      });
    }
  }
);

router.patch(
  "/:id",
  authMiddleware,
  upload.fields([{ name: "video" }, { name: "audio" }]),
  async (req, res) => {
    console.log("Request Params:", req.params); // Log the params to verify the id
    console.log("Request Files:", req.files); // Log the uploaded files (if any)
    try {
      const { rating, feedback } = req.body;
      const videoPath =
        req.files && req.files.video ? req.files.video[0].path : null;
      const audioPath =
        req.files && req.files.audio ? req.files.audio[0].path : null;

      const updatedFeedback = await updateFeedback(req.params.id, {
        rating,
        feedback,
        video: videoPath,
        audio: audioPath,
      });

      res.status(200).json({
        message: "Feedback updated successfully",
        feedback: updatedFeedback,
      });
    } catch (error) {
      console.error("Error updating feedback:", error);
      res.status(500).json({
        message: "Error updating feedback",
        error: error.message || error,
      });
    }
  }
);

router.get("/", authMiddleware, async (req, res) => {
  try {
    const feedbacks = await getAllFeedbacks(req.user.id);
    res.json(feedbacks);
  } catch (error) {
    res.status(400).json({ message: "Error fetching feedback", error });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const feedback = await getFeedbackById(req.user.id, req.params.id);
    if (!feedback)
      return res.status(404).json({ message: "Feedback not found" });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: "Error fetching feedback", error });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const feedback = await deleteFeedback(req.user.id, req.params.id);
    if (!feedback)
      return res.status(404).json({ message: "Feedback not found" });
    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting feedback", error });
  }
});

module.exports = router;
