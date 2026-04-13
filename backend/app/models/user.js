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
    phone:         { type: String, unique: true, sparse: true, trim: true },
    role:          { type: String, enum: ['user', 'admin'], default: 'user' },
    useDefaultOtp: { type: Boolean, default: false }, // dev flag — OTP '111111' always works
    profileImage:  {
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    otp:           { type: String, select: false },
    otpExpiry:     { type: Date,   select: false },
    otpAttempts:   { type: Number, default: 0, select: false },
    otpLastSent:   { type: Date,   select: false },
    addresses:     [addressSchema],
    isActive:      { type: Boolean, default: true },
    isDeleted:     { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

// ── setOtp: hash and store OTP ──────────────────────────────────────────────
userSchema.methods.setOtp = async function (plainOtp) {
  const salt      = await bcrypt.genSalt(10);
  this.otp        = await bcrypt.hash(String(plainOtp), salt);
  this.otpExpiry  = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
  this.otpAttempts = 0;
  this.otpLastSent = new Date();
  await this.save();
};

// ── verifyOtp: compare submitted OTP ────────────────────────────────────────
userSchema.methods.verifyOtp = async function (plainOtp) {
  const submitted = String(plainOtp);

  // Dev bypass — always accept '111111' when flag is on AND in development mode
  if (this.useDefaultOtp && submitted === '111111' && process.env.NODE_ENV === 'development') {
    this.otp = undefined; this.otpExpiry = undefined; this.otpAttempts = 0;
    await this.save();
    return true;
  }

  if (!this.otp || !this.otpExpiry)   return false;
  if (new Date() > this.otpExpiry)    return false;
  if (this.otpAttempts >= 5)          return false;

  const isMatch = await bcrypt.compare(submitted, this.otp);
  if (!isMatch) {
    this.otpAttempts += 1;
    await this.save();
    return false;
  }

  this.otp = undefined; this.otpExpiry = undefined; this.otpAttempts = 0;
  await this.save();
  return true;
};

// ── canResendOtp: 60s cooldown ───────────────────────────────────────────────
userSchema.methods.canResendOtp = function () {
  if (!this.otpLastSent) return true;
  return (Date.now() - this.otpLastSent.getTime()) / 1000 >= 60;
};

module.exports = mongoose.model('user', userSchema, 'user');
