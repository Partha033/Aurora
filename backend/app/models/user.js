const { mongoose } = require('../services/imports');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label:   { type: String, default: 'Home' },
  line1:   { type: String, required: true },
  line2:   { type: String },
  city:    { type: String, required: true },
  state:   { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' },
}, { _id: true });

const userSchema = new mongoose.Schema(
  {
    name:          { type: String, trim: true, default: '' },
    email:         { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password:      { type: String, select: false }, // No longer strictly required for all
    phone:         { type: String, unique: true, sparse: true, trim: true },
    role:          { type: String, enum: ['user', 'admin'], default: 'user' },
    profileImage:  {
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    addresses:     [addressSchema],
    isActive:      { type: Boolean, default: true },
    isDeleted:     { type: Boolean, default: false },
    otp:           { type: String, select: false },
    otpExpiry:     { type: Date, select: false },
  },
  { timestamps: true, versionKey: false }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('user', userSchema, 'user');
