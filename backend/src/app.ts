import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminRoutes from './routes/adminRoutes';
import vendorRoutes from './routes/vendorRoutes';
import complaintRoutes from './routes/complaintRoutes';
import notificationRoutes from './routes/notificationRoutes';
import rationCardRoutes from './routes/rationCardRoutes';
import distributionRoutes from './routes/distributionRoutes';

const app = express();

// Trust Proxy for Cloud Deployment (Heroku, Railway, AWS ELB)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = new Set([
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://127.0.0.1:8080',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:5173'
]);

const isAllowedDevOrigin = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin) || isAllowedDevOrigin(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(helmet());
app.use(morgan('dev'));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

import rateLimit from 'express-rate-limit';
import { errorHandler, notFound } from './middleware/errorMiddleware';

const isDevelopment = process.env.NODE_ENV !== 'production';
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 1000 : 300,
    message: { success: false, message: 'Too many requests, please try again later.' }
});

app.use('/api', limiter); // Apply to all API routes for simplicity as base hardening

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ration-card', rationCardRoutes);
app.use('/api/distributions', distributionRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Basic route for testing
app.get('/', (req, res) => {
    res.send('E-Ration Shop API is running...');
});

export default app;
