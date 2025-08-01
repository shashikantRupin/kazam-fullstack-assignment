const mongoose = require("mongoose");
require("dotenv").config()
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB Error", error);
    process.exit(1);
  }
};

export default connectDB;
