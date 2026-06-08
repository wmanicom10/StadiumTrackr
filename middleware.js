const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        const timeRemaining = decoded.exp - Math.floor(Date.now() / 1000);
        if (timeRemaining < 3 * 24 * 60 * 60) {
            const newToken = jwt.sign(
                { userId: decoded.userId, username: decoded.username, email: decoded.email, profilePic: decoded.profilePic },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            res.setHeader('X-New-Token', newToken);
        }

        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
        }
    }
    next();
};

module.exports = { authMiddleware, optionalAuth };