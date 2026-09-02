const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./config/db');
const initSocket = require('./sockets/socketHandler');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const User = require('./models/User');

// Route imports
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const workerRoutes = require('./routes/workerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Attach io to global scope for notification and status broadcasts
global.io = io;
initSocket(io);

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SupportFlow API is operational',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Seed initial Admin user if not present
const seedDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'System Administrator',
        email: 'admin@supportflow.com',
        password: 'AdminPassword123!',
        role: 'admin',
        isActive: true,
        workerApprovalStatus: 'None',
      });
      console.log('[Seed] Default administrator account created: admin@supportflow.com / AdminPassword123!');
    }
  } catch (err) {
    console.error('[Seed] Error checking or seeding admin account:', err.message);
  }
};

const startServer = async (customPort) => {
  await connectDB();
  await seedDefaultAdmin();

  const port = customPort || process.env.PORT || 5000;
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`\n=================================================`);
      console.log(` SupportFlow Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
      console.log(` API Endpoint: http://localhost:${port}/api`);
      console.log(`=================================================\n`);
      resolve(server);
    });
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;