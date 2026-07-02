require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

const paymentController = require('./controllers/paymentController');

app.post('/payment/webhook', express.raw({ type: 'application/json' }), paymentController.handleStripeWebhook);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', require('./routes/authRoutes'));
app.use('/load', require('./routes/loadRoutes'));
app.use('/payment', require('./routes/paymentRoutes'));
app.use('/update', require('./routes/updateRoutes'));
app.use('/user', require('./routes/userRoutes'));

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});