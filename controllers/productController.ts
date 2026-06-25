import { Request, Response, NextFunction } from 'express';
import { fetchProductsFromDB, ProductRow } from '../models/productModel.js';
import { encodeCursor, decodeCursor } from '../utils/cursorUtils.js';
import pool from "../config/dbConnect.js";

// GET All Products => /api/v1/products
export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;

        // Changed to 400: This is a Bad Request from the client, not an Internal Server Error
        if (limit > 200) {
            res.status(400).json({
                success: false,
                message: "Limit cannot exceed 200 items per request"
            });
            return;
        }

        const category = req.query.category as string | undefined;
        const cursor = req.query.cursor as string | undefined;
        const search = req.query.search as string | undefined;

        const cursorData = decodeCursor(cursor);

        // 2. Pass the search term to your database function
        const rows: ProductRow[] = await fetchProductsFromDB({
            limit,
            cursorData,
            category,
            search
        });

        const hasNextPage = rows.length > limit;
        const items = hasNextPage ? rows.slice(0, limit) : rows;

        let nextCursor: string | null = null;
        if (hasNextPage && items.length > 0) {
            const lastItem = items[items.length - 1];
            nextCursor = encodeCursor(lastItem.created_at, lastItem.id);
        }

        res.status(200).json({
            success: true,
            data: items,
            pagination: {
                nextCursor,
                hasNextPage
            }
        });
    } catch (error) {
        next(error);
    }
};


// GET Product by id => /api/v1/products:id
export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        // 1. Query the database for the specific ID
        const query = `SELECT id, name, category, price, created_at, updated_at FROM products WHERE id = $1;`;
        const { rows } = await pool.query(query, [id]);

        // 2. Handle case where product does not exist
        if (rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "Product not found"
            });
            return;
        }

        // 3. Return the single product
        res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        next(error);
    }
};



// Creeate Product =>/api/v1/products/create
export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, category, price } = req.body;

        // 1. Basic Validation
        if (!name || !category || price === undefined) {
            res.status(400).json({
                success: false,
                message: "Please provide name, category, and price"
            });
            return;
        }

        // 2. Database Insertion
        // Using RETURNING * to get the created product back immediately
        const query = `
            INSERT INTO products (name, category, price, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING id, name, category, price, created_at;
        `;

        const values = [name, category, price];
        const { rows } = await pool.query(query, values);

        // 3. Respond with the created item
        res.status(201).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        // Pass to your global error handler
        next(error);
    }
};


// Delete Product =>/api/v1/products:id
export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        // 1. Delete the record
        const query = `DELETE FROM products WHERE id = $1 RETURNING id;`;
        const { rowCount } = await pool.query(query, [id]);

        // 2. Check if the product actually existed
        if (rowCount === 0) {
            res.status(404).json({
                success: false,
                message: "Product not found"
            });
            return;
        }

        // 3. Success response
        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};



// UPDATE product => /api/v1/products:id
export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, category, price } = req.body;

        // 1. Build a dynamic query to allow updating only what is provided
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(name); }
        if (category !== undefined) { fields.push(`category = $${paramIndex++}`); values.push(category); }
        if (price !== undefined) { fields.push(`price = $${paramIndex++}`); values.push(price); }

        // Update the updated_at timestamp as well
        fields.push(`updated_at = NOW()`);

        if (fields.length === 1) { // Only updated_at was pushed
            res.status(400).json({ success: false, message: "No fields provided to update" });
            return;
        }

        const query = `
            UPDATE products 
            SET ${fields.join(', ')} 
            WHERE id = $${paramIndex} 
            RETURNING id, name, category, price, updated_at;
        `;
        values.push(id);

        const { rows, rowCount } = await pool.query(query, values);

        // 2. Check if the product existed
        if (rowCount === 0) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        next(error);
    }
};