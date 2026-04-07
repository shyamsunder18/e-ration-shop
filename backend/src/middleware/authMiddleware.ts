import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User, { IUser, UserRole, VendorStatus } from '../models/User';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

interface DecodedToken extends JwtPayload {
    userId: string;
    role: UserRole;
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    token = req.cookies.jwt;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as DecodedToken;

            req.user = await User.findById(decoded.userId).select('-password') || undefined;

            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            // Vendor Status Check
            if (req.user.role === UserRole.VENDOR && req.user.status !== VendorStatus.APPROVED) {
                res.status(403).json({ message: 'Vendor account is not approved yet.' });
                return;
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === UserRole.ADMIN) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

export const vendorOnly = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === UserRole.VENDOR) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a vendor' });
    }
};
