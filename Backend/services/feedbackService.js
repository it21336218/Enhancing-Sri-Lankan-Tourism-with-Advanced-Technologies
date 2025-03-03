const fs = require("fs");
const Feedback = require("../models/Feedback");
const mongoose = require("mongoose");

// Ensure uploads directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const addFeedback = async (userId, rating, feedback, video, audio) => {
  const newFeedback = new Feedback({
    user: userId,
    rating,
    feedback,
    video,
    audio,
  });
  await newFeedback.save();
  return newFeedback;
};

const getAllFeedbacks = async (userId) => {
  const feedbacks = await Feedback.find({ user: userId });
  return feedbacks.map((feedback) => ({
    ...feedback._doc,
    video: feedback.video ? `http://localhost:3005/${feedback.video}` : null,
    audio: feedback.audio ? `http://localhost:3005/${feedback.audio}` : null,
  }));
};

const getFeedbackById = async (userId, id) => {
  const feedback = await Feedback.findById({ _id: id, user: userId });
  if (!feedback) return null;
  return {
    ...feedback._doc,
    video: feedback.video ? `http://localhost:3005/${feedback.video}` : null,
    audio: feedback.audio ? `http://localhost:3005/${feedback.audio}` : null,
  };
};

const deleteFeedback = async (userId, id) => {
  const feedback = await Feedback.findById({ _id: id, user: userId });
  if (!feedback) return null;

  if (feedback.video && fs.existsSync(feedback.video)) {
    fs.unlinkSync(feedback.video);
  }
  if (feedback.audio && fs.existsSync(feedback.audio)) {
    fs.unlinkSync(feedback.audio);
  }

  await Feedback.findByIdAndDelete(id);
  return feedback;
};

const updateFeedback = async (feedbackId, updatedData) => {
  try {
    // Validate feedbackId format (ensure it is a valid ObjectId)
    if (!mongoose.Types.ObjectId.isValid(feedbackId)) {
      throw new Error("Invalid Feedback ID");
    }

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Only update video/audio if a valid path is provided
    if (updatedData.video) {
      if (fs.existsSync(updatedData.video)) {
        feedback.video = updatedData.video;
      } else {
        throw new Error("Video file not found");
      }
    }

    if (updatedData.audio) {
      if (fs.existsSync(updatedData.audio)) {
        feedback.audio = updatedData.audio;
      } else {
        throw new Error("Audio file not found");
      }
    }
    feedback.rating = updatedData.rating || feedback.rating;
    feedback.feedback = updatedData.feedback || feedback.feedback;

    await feedback.save();
    return feedback;
  } catch (error) {
    throw new Error("Error updating feedback: " + error.message);
  }
};

module.exports = {
  addFeedback,
  getAllFeedbacks,
  getFeedbackById,
  deleteFeedback,
  updateFeedback,
};
