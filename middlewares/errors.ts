import { Request, Response, NextFunction } from 'express';

// Extend the native Error class to allow custom status codes
export interface AppError extends Error {
    statusCode?: number;
}

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
    console.error('Server Error:', err.message);

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
};