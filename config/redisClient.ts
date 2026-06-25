import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err: Error) => console.error('Redis Client Error:', err.message));
redisClient.on('connect', () => console.log('⚡ Redis Cache Connected!'));

export const connectRedis = async (): Promise<void> => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('Failed to connect to Redis', error);
    }
};

export default redisClient;