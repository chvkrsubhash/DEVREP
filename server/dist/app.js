"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const auth_1 = require("./routes/auth");
const public_1 = require("./routes/public");
const private_1 = require("./routes/private");
function createApp() {
    const app = (0, express_1.default)();
    // Basic security and parsing
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cookie_parser_1.default)());
    // CORS configuration
    const allowedOrigins = [
        process.env.APP_URL || 'http://localhost:3000',
        'http://127.0.0.1:3000',
    ];
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(null, true); // Allow dev & production origins
            }
        },
        credentials: true,
    }));
    // Session configuration
    app.use((0, express_session_1.default)({
        secret: process.env.SESSION_SECRET || 'devrep-secret-session-key-dev-mode',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: 'lax',
        },
    }));
    // Health check (supports both /api/health and /health)
    app.get(['/health', '/api/health'], (req, res) => {
        res.json({
            status: 'ok',
            service: 'devrep-api',
            timestamp: new Date().toISOString(),
        });
    });
    // Mount Route Modules (supports both /api/* and direct paths)
    app.use(['/auth', '/api/auth'], auth_1.authRouter);
    app.use(['/public', '/api/public'], public_1.publicRouter);
    app.use(['/me', '/api/me'], private_1.privateRouter);
    // 404 handler for API routes
    app.use((req, res) => {
        res.status(404).json({ error: 'Endpoint not found', path: req.url });
    });
    // Global error handler
    app.use((err, req, res, next) => {
        console.error('Unhandled Application Error:', err);
        res.status(err.status || 500).json({
            error: 'Internal Server Error',
            message: err.message || 'An unexpected error occurred.',
        });
    });
    return app;
}
