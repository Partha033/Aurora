require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./connection');
const responseHandler = require('./app/middlewares/response-handler');

const app = express();
connectDB();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(responseHandler);

app.use('/api', require('./app/routes/__index'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, msg: `Route ${req.originalUrl} not found` });
});

// Error Handler
const { errorHandlerFunction } = require('./app/middlewares/error');
app.use((err, req, res, next) => {
  errorHandlerFunction(res, err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
