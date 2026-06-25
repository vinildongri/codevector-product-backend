import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redisClient.js';

export const cacheProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Create a unique cache key based on the exact URL parameters (limit, cursor, category)
    const key = `products:${req.originalUrl}`;

    try {
        const cachedData = await redisClient.get(key);

        if (cachedData) {
            console.log('🟢 Serving from Redis Cache:', key);
            res.status(200).json(JSON.parse(cachedData));
            return;
        }

        console.log('🔴 Cache Miss. Fetching from PostgreSQL:', key);

        // Hijack the res.json method to save the data before it leaves the server
        const originalJson = res.json.bind(res);

        res.json = (body: any): Response<any> => {
            // 2-Second TTL: Absorbs massive traffic spikes without serving deeply stale data
            redisClient.setEx(key, 2, JSON.stringify(body));
            return originalJson(body);
        };

        next();
    } catch (error) {
        console.error('Redis Middleware Error:', error);
        next(); // If Redis crashes, just bypass it and hit the DB normally
    }
};