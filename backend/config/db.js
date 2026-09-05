const mongoose = require("mongoose");

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined");
    }

    connectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    await connectionPromise;

    console.log(
      `[Database] Connected to MongoDB: ${mongoose.connection.host}`
    );
    return mongoose.connection;
  } catch (error) {
    connectionPromise = undefined;
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