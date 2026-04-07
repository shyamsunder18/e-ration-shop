import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { UserRole } from '../models/User';

const generateToken = (res: Response, userId: string, role: UserRole) => {
    const token = jwt.sign({ userId, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Secure in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // Cross-site support in prod
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
};

export default generateToken;
