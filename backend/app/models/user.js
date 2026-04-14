const { mongoose } = require('../services/imports');

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
    profileImage:  {
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    addresses:     [addressSchema],
    isActive:      { type: Boolean, default: true },
    isDeleted:     { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('user', userSchema, 'user');
