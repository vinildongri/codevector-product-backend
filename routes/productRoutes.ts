import express from 'express';
import { createProduct, deleteProduct, getProductById, getProducts, updateProduct } from '../controllers/productController.js';
// import { cacheProducts } from '../middlewares/cacheMiddleware.js';

const router = express.Router();

router.get('/products', getProducts);
router.post('/products/create', createProduct);
router.get('/products/:id', getProductById);
router.delete('/products/:id', deleteProduct);
router.patch('/products/:id', updateProduct);


export default router;