const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const app = express();
dotenv.config();

const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(bodyParser.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const url = process.env.MONGODB_URL;

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB connected successfully");
});

const feedbackRouter = require("./routes/feedback.js");
app.use("/feedback", feedbackRouter);

const authRouter = require("./routes/authRoutes.js");
app.use("/api/users", authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
