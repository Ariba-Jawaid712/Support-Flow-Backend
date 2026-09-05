const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(mongoUri);

    console.log(
      `[Database] Connected to MongoDB: ${mongoose.connection.host}`
    );
  } catch (error) {
    console.error("[Database] MongoDB connection failed:", error.message);
    throw error;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
};

module.exports = {
  connectDB,
  disconnectDB,
};