import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    console.error(err.stack); // Log stack trace only in backend console

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // Only show stack in dev
    });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};
