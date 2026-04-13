/**
 * seed.js — Insert dummy users + products into MongoDB Atlas
 *
 * Run: node seed.js
 * From: backend/
 *
 * To wipe & re-seed: node seed.js --reset
 */

require('dotenv').config();
const mongoose = require('mongoose');

/* ── Inline models (avoids service-import chain) ── */
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, trim: true, default: '' },
  email:    { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone:    { type: String, unique: true, sparse: true, trim: true },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  otp:      { type: String, select: false },
  otpExpiry:{ type: Date,   select: false },
  otpAttempts: { type: Number, default: 0, select: false },
  otpLastSent: { type: Date,  select: false },
  addresses:[],
  isActive: { type: Boolean, default: true },
  isDeleted:{ type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

const productSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  description:     { type: String, required: true },
  price:           { type: Number, required: true },
  discountedPrice: { type: Number, default: null },
  images:          [{ url: String, publicId: String }],
  category:        { type: String, required: true, lowercase: true },
  stock:           { type: Number, required: true, default: 0 },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  isActive:        { type: Boolean, default: true },
  isDeleted:       { type: Boolean, default: false },
  rating:          { type: Number, default: 0 },
  numReviews:      { type: Number, default: 0 },
}, { timestamps: true, versionKey: false });

const User    = mongoose.model('user',    userSchema,    'user');
const Product = mongoose.model('product', productSchema, 'product');

/* ── Dummy data ─────────────────────────────────────────────── */

const USERS = [
  {
    name:          'Priya Sharma',
    email:         'priya.sharma@gmail.com',
    phone:         '9876543210',
    role:          'user',
    useDefaultOtp: true,   // login with OTP: 1111
    isActive:      true,
    addresses: [{
      label:   'Home',
      line1:   '12, MG Road, Koramangala',
      line2:   'Near Café Coffee Day',
      city:    'Bengaluru',
      state:   'Karnataka',
      pincode: '560034',
      country: 'India',
    }],
  },
  {
    name:          'Admin Aurora',
    email:         'admin@aurorajewels.com',
    phone:         '9000000001',
    role:          'admin',
    useDefaultOtp: true,   // login with OTP: 1111
    isActive:      true,
    addresses:     [],
  },
  {
    name:          'Rahul Mehta',
    email:         'rahul.mehta@outlook.com',
    phone:         '9123456789',
    role:          'user',
    useDefaultOtp: true,   // login with OTP: 1111
    isActive:      true,
    addresses: [{
      label:   'Office',
      line1:   '5th Floor, Prestige Tower',
      line2:   'Cunningham Road',
      city:    'Bengaluru',
      state:   'Karnataka',
      pincode: '560052',
      country: 'India',
    }],
  },
];

/* Admin ObjectId needed for createdBy — seeded first */
const PRODUCT_PLACEHOLDER_IMG = 'https://res.cloudinary.com/drf2kq1gt/image/upload/v1/aurora-jewels/placeholder';

const getProducts = (adminId) => [
  {
    name:            '22K Gold Kundan Ring',
    description:     'A stunning 22K gold Kundan ring adorned with semi-precious stones. Perfect for weddings and festive occasions.',
    price:           24999,
    discountedPrice: 21999,
    category:        'rings',
    stock:           15,
    rating:          4.7,
    numReviews:      12,
    createdBy:       adminId,
    images: [{ url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600', publicId: 'aurora/ring1' }],
  },
  {
    name:            'Sterling Silver Twisted Band',
    description:     'Minimalist 925 sterling silver twisted band ring. Elegant for everyday wear, lightweight and durable.',
    price:           2499,
    discountedPrice: 1999,
    category:        'rings',
    stock:           40,
    rating:          4.5,
    numReviews:      8,
    createdBy:       adminId,
    images: [{ url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600', publicId: 'aurora/ring2' }],
  },
  {
    name:            'Diamond Solitaire Necklace',
    description:     'Elegant 0.25 carat diamond solitaire pendant on an 18K white gold chain. The epitome of timeless beauty.',
    price:           89999,
    discountedPrice: null,
    category:        'necklaces',
    stock:           5,
    rating:          4.9,
    numReviews:      21,
    createdBy:       adminId,
    images: [{ url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600', publicId: 'aurora/necklace1' }],
  },
  {
    name:            'Temple Gold Necklace',
    description:     'Traditional temple-style necklace in 22K gold with intricate deity motifs. A timeless heirloom piece.',
    price:           45999,
    discountedPrice: 42500,
    category:        'necklaces',
    stock:           8,
    rating:          4.8,
    numReviews:      15,
    createdBy:       adminId,
    images: [{ url: 'https://images.unsplash.com/photo-1631982690223-8aa4e67f9c0d?w=600', publicId: 'aurora/necklace2' }],
  },
  {
    name:            'Pearl Drop Earrings',
    description:     'South Sea pearl drop earrings in 18K rose gold. Soft, lustrous pearls with a modern setting.',
    price:           8999,
    discountedPrice: 7499,
    category:        'earrings',
    stock:           22,
    rating:          4.6,
    numReviews:      9,
    createdBy:       adminId,
    images: [{ url: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600', publicId: 'aurora/earring1' }],
  },
  {
    name:            'Jhumka Gold Earrings',
    description:     'Classic Indian jhumka earrings in 22K gold. Finished with small hanging bells and enamel work.',
    price:           18500,
    discountedPrice: null,
    category:        'earrings',
    stock:           12,
    rating:          4.7,
    numReviews:      18,
    createdBy:       adminId,
    images: [{ url: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600', publicId: 'aurora/earring2' }],
  },
  {
    name:            '18K Gold Tennis Bracelet',
    description:     'Elegant 18K gold tennis bracelet set with 24 brilliant-cut diamonds. Total carat weight: 1.5ct.',
    price:           79999,
    discountedPrice: 72000,
    category:        'bracelets',
    stock:           6,
    rating:          4.9,
    numReviews:      7,
    createdBy:       adminId,
    images: [{ url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600', publicId: 'aurora/bracelet1' }],
  },
  {
    name:            'Silver Charm Bracelet',
    description:     'Playful sterling silver charm bracelet with 5 interchangeable charms — moon, star, heart, key, and feather.',
    price:           3999,
    discountedPrice: 3299,
    category:        'bracelets',
    stock:           35,
    rating:          4.4,
    numReviews:      11,
    createdBy:       adminId,
    images: [{ url: 'https://images.unsplash.com/photo-1573408301185-9519f94815b5?w=600', publicId: 'aurora/bracelet2' }],
  },
  {
    name:            'Emerald Gold Pendant',
    description:     'Colombian emerald pendant (0.5ct) in 18K yellow gold with a halo diamond setting. Deep vivid green.',
    price:           34500,
    discountedPrice: 30000,
    category:        'pendants',
    stock:           0,
    rating:          4.8,
    numReviews:      5,
    createdBy:       adminId,
    images: [{ url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600', publicId: 'aurora/pendant1' }],
  },
  {
    name:            'Bridal Gold Set',
    description:     'Complete bridal jewellery set: necklace, earrings, maang tikka, and bangles in 22K gold. An unforgettable trousseau.',
    price:           199999,
    discountedPrice: 185000,
    category:        'sets',
    stock:           3,
    rating:          5.0,
    numReviews:      4,
    createdBy:       adminId,
    images: [{ url: 'https://images.unsplash.com/photo-1624913503273-5f9c4e980dba?w=600', publicId: 'aurora/set1' }],
  },
  {
    name:            'Rose Gold Mangalsutra',
    description:     'Modern rose gold mangalsutra with black beads and a sleek diamond-studded pendant. Tradition meets trend.',
    price:           27500,
    discountedPrice: 24999,
    category:        'necklaces',
    stock:           9,
    rating:          4.6,
    numReviews:      13,
    createdBy:       adminId,
    images: [{ url: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=600', publicId: 'aurora/necklace3' }],
  },
  {
    name:            'Blue Sapphire Ring',
    description:     'Royal blue sapphire (1ct, Sri Lanka) in a six-prong platinum setting. Surrounded by a halo of round diamonds.',
    price:           55000,
    discountedPrice: 49999,
    category:        'rings',
    stock:           7,
    rating:          4.9,
    numReviews:      6,
    createdBy:       adminId,
    images: [{ url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600', publicId: 'aurora/ring3' }],
  },
];

/* ── Seed function ───────────────────────────────────────────── */
async function seed() {
  const reset = process.argv.includes('--reset');

  console.log('\n🌱  AuroraJewels Seed Script');
  console.log('─────────────────────────────────');

  await mongoose.connect(process.env.DB_URL);
  console.log('✅  MongoDB connected');

  if (reset) {
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️   Wiped users & products');
  }

  /* ── Seed users ── */
  let adminUser = null;
  let created   = 0;
  let skipped   = 0;

  for (const u of USERS) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      if (u.role === 'admin') adminUser = exists;
      skipped++;
      console.log(`  ⏭  Skipped (already exists): ${u.email}`);
      continue;
    }
    const doc = await User.create(u);
    if (u.role === 'admin') adminUser = doc;
    created++;
    console.log(`  ✦  Created ${u.role.padEnd(5)} → ${u.email}`);
  }

  console.log(`\n👥  Users: ${created} created, ${skipped} skipped`);

  /* ── Seed products ── */
  if (!adminUser) {
    console.error('❌  Admin user not found — cannot create products');
    process.exit(1);
  }

  const products   = getProducts(adminUser._id);
  let prodCreated  = 0;
  let prodSkipped  = 0;

  for (const p of products) {
    const exists = await Product.findOne({ name: p.name });
    if (exists) { prodSkipped++; continue; }
    await Product.create(p);
    prodCreated++;
    console.log(`  ✦  Product → ${p.name} (${p.category}) ₹${p.price.toLocaleString('en-IN')}`);
  }

  console.log(`\n💎  Products: ${prodCreated} created, ${prodSkipped} skipped`);

  /* ── Summary ── */
  console.log('\n─────────────────────────────────');
  console.log('📋  ACCOUNTS YOU CAN USE TO LOGIN\n');
  console.log('  👤  Regular User');
  console.log('      Email : priya.sharma@gmail.com');
  console.log('      Phone : 9876543210');
  console.log('      Role  : user\n');
  console.log('  👤  Regular User #2');
  console.log('      Email : rahul.mehta@outlook.com');
  console.log('      Phone : 9123456789');
  console.log('      Role  : user\n');
  console.log('  🔑  Admin');
  console.log('      Email : admin@aurorajewels.com');
  console.log('      Phone : 9000000001');
  console.log('      Role  : admin');
  console.log('\n  ➡  Login via OTP — just enter the email in the app,');
  console.log('     check your inbox for the 6-digit code.\n');

  await mongoose.disconnect();
  console.log('🔌  Disconnected. Done!\n');
}

seed().catch(err => {
  console.error('\n❌ Seed error:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
