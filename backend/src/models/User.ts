import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { IUser } from '../types';

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: null
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  preferences: {
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR']
    },
    notifications: {
      type: Boolean,
      default: true
    },
    biometricAuth: {
      type: Boolean,
      default: false
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh']
    }
  },
  refreshToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  console.log('🟣 USER MODEL PRE-SAVE: Middleware triggered');
  console.log('🟣 Password modified:', this.isModified('password'));
  console.log('🟣 Original password:', this.password);
  
  if (!this.isModified('password')) {
    console.log('🟣 USER MODEL PRE-SAVE: Password not modified, skipping hash');
    return next();
  }
  
  try {
    console.log('🟣 USER MODEL PRE-SAVE: Hashing password...');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    console.log('🟣 USER MODEL PRE-SAVE: Password hashed successfully');
    console.log('🟣 Hashed password:', hashedPassword);
    
    this.password = hashedPassword;
    
    // Test the hash immediately
    const testCompare = await bcrypt.compare(this.password, hashedPassword);
    console.log('🟣 USER MODEL PRE-SAVE: Immediate hash test:', testCompare);
    
    next();
  } catch (error) {
    console.error('🟣 USER MODEL PRE-SAVE ERROR:', error);
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate access token
userSchema.methods.generateAccessToken = function(): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return (jwt.sign as any)(
    { 
      userId: this._id.toString(),
      email: this.email 
    },
    secret,
    { 
      expiresIn: process.env.JWT_EXPIRE || '7d' 
    }
  );
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function(): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return (jwt.sign as any)(
    { 
      userId: this._id.toString() 
    },
    secret,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' 
    }
  );
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  return userObject;
};

export const User = mongoose.model<IUser>('User', userSchema);
