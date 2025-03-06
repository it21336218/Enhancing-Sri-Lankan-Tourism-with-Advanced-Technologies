const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const feedbackSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: false,
  },
  feedback: {
    type: String,
    required: false,
  },
  video: {
    type: String,
    required: false,
  },
  audio: {
    type: String,
    required: false,
  },
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
