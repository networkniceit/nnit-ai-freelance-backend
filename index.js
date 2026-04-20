// Entry point for Express backend
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3003;
// Serve lightweight standalone frontend at /free
const freeFrontendPath = path.join(__dirname, 'frontend-free');
if (fs.existsSync(freeFrontendPath)) {
    app.use('/free', express.static(freeFrontendPath));
    app.get('/free', (req, res) => res.sendFile(path.join(freeFrontendPath, 'index.html')));
}

// Serve standalone frontend at /standalone (completely separate)
const standalonePath = path.join(__dirname, 'frontend-standalone');
if (fs.existsSync(standalonePath)) {
    app.use('/standalone', express.static(standalonePath));
    app.get('/standalone', (req, res) => res.sendFile(path.join(standalonePath, 'index.html')));
}



// Middleware
app.use(express.json());
// CORS support
const cors = require('cors');
app.use(cors());

// Database connection
const mongoose = require('mongoose');
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nnit-freelance';
mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));


// Explicitly mount /api/auth for authentication
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Dynamically load all other routes in routes/
const routesPath = path.join(__dirname, 'routes');
fs.readdirSync(routesPath).forEach(file => {
    if (file.endsWith('.js') && file !== 'auth.js') {
        const route = require(path.join(routesPath, file));
        const routeName = file.replace('.js', '');
        app.use(`/api/${routeName}`, route);
    }
});


// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Convenience redirects for common paths
app.all('/login', async (req, res) => {
    if (req.method === 'POST') {
        // Forward POST requests to auth login
        const { login } = require('./controllers/authController');
        return login(req, res);
    } else {
        res.status(200).json({
            message: 'Login endpoint',
            method: 'POST',
            endpoint: '/login or /api/auth/login',
            body_required: { email: 'string', password: 'string' }
        });
    }
});

app.all('/register', async (req, res) => {
    if (req.method === 'POST') {
        // Forward POST requests to auth register
        const { register } = require('./controllers/authController');
        return register(req, res);
    } else {
        res.status(200).json({
            message: 'Register endpoint',
            method: 'POST', 
            endpoint: '/register or /api/auth/register',
            body_required: { email: 'string', password: 'string', name: 'string' }
        });
    }
});

// Default root route
app.get('/', (req, res) => {
    res.send('NNIT-ai-freelance-backend API is running.');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server started on http://127.0.0.1:${PORT}/`);
});
