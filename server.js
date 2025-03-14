const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const stadiumRoutes = require('./routes/stadiumRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/stadium', stadiumRoutes);
app.use('/user', userRoutes);

app.listen(3000, () => {
    console.log('Server running on port 3000');
});