import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import productRoutes from "./routes/productRoutes.js";
import { errorHandler } from "./middlewares/errors.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: [
        'https://codevector-product-frontend-1aexhm17f-vinil-dongris-projects.vercel.app',
        'http://localhost:3000'
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'], // Ensure all methods are allowed
    credentials: true
}));

app.use(express.json());
app.use('/api/v1', productRoutes);
app.use(errorHandler);

app.listen(process.env.PORT, () => {
    console.log(`Server Started on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode`);
});