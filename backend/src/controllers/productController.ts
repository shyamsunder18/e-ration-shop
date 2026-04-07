import { Request, Response } from 'express';
import Product from '../models/Product';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req: Request, res: Response) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req: Request, res: Response) => {
    const { name, description, unit, thumbnail } = req.body;

    const productExists = await Product.findOne({ name });

    if (productExists) {
        res.status(400).json({ message: 'Product already exists' });
        return;
    }

    const product = await Product.create({
        name,
        description,
        unit,
        thumbnail,
    });

    if (product) {
        res.status(201).json(product);
    } else {
        res.status(400).json({ message: 'Invalid product data' });
    }
};
