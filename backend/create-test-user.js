const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_tracker');

// User schema (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  isPremium: { type: Boolean, default: false },
  joinDate: { type: Date, default: Date.now },
  preferences: {
    currency: { type: String, default: 'USD' },
    notifications: { type: Boolean, default: true },
    biometricAuth: { type: Boolean, default: false },
    darkMode: { type: Boolean, default: false },
    language: { type: String, default: 'en' }
  }
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists!');
      console.log('Email: test@example.com');
      console.log('Password: password123');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
    });

    await testUser.save();
    console.log('Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser(); 