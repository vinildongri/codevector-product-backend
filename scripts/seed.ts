import dotenv from "dotenv";
import { faker } from "@faker-js/faker";
import mysql, { Connection } from "mysql2/promise";

dotenv.config();

const CATEGORIES: string[] = [
    "Electronics",
    "Clothing",
    "Home & Kitchen",
    "Beauty",
    "Sports",
    "Books",
    "Automotive",
];

// Set to 200,000
const TOTAL_PRODUCTS: number = 200000;
// Insert 10,000 at a time to prevent memory & packet crashes
const BATCH_SIZE: number = 10000;

async function seedDatabase(): Promise<void> {
    console.log("Connecting to the database...");

    const connection: Connection = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "codevector_catalog",
    });

    try {
        console.log("Ensuring products table exists...");
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log(`Clearing old data...`);
        await connection.execute("TRUNCATE TABLE products");

        console.log(`Starting generation of ${TOTAL_PRODUCTS} products in batches of ${BATCH_SIZE}...`);

        const query = "INSERT INTO products (name, category, price, created_at) VALUES ?";

        // Loop through in batches
        for (let i = 0; i < TOTAL_PRODUCTS; i += BATCH_SIZE) {
            const values: (string | number)[][] = [];
            const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_PRODUCTS - i);

            for (let j = 0; j < currentBatchSize; j++) {
                const name: string = faker.commerce.productName();
                const category: string = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
                const price: number = parseFloat(faker.commerce.price({ min: 10, max: 2000, dec: 2 }));
                const createdAt: string = faker.date.past({ years: 1 }).toISOString().slice(0, 19).replace('T', ' ');

                values.push([name, category, price, createdAt]);
            }

            // Insert the current batch
            await connection.query(query, [values]);
            console.log(`Inserted batch: ${i + currentBatchSize} / ${TOTAL_PRODUCTS}`);
        }

        console.log("Massive seeding complete! Your 200k catalog is ready.");
    } catch (error) {
        console.error("Seeding failed:", error);
    } finally {
        await connection.end();
    }
}

seedDatabase();