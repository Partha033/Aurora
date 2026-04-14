require('dotenv').config();
const dns = require('dns');

// ── GLOBAL FIX: Force IPv4 priority for all network requests (Node 17+) ────
// This prevents "ENETUNREACH" errors on platforms like Render that have 
// unstable IPv6 outbound routing.
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./connection');
const responseHandler = require('./app/middlewares/response-handler');

const app = express();

// ✅ Connect DB
connectDB();

// ✅ CORS (FIXED)
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ✅ Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(responseHandler);

// ✅ Health route (IMPORTANT for Render)
app.get("/", (req, res) => {
  res.send("🚀 API Running");
});

// ✅ Routes
app.use('/api', require('./app/routes/__index'));

// ✅ 404
app.use((req, res) => {
  res.status(404).json({ success: false, msg: `Route ${req.originalUrl} not found` });
});

// ✅ Error Handler
const { errorHandlerFunction } = require('./app/middlewares/error');
app.use((err, req, res, next) => {
  console.error(err.message);
  errorHandlerFunction(res, err);
});

// ✅ PORT FIX (CRITICAL)
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
