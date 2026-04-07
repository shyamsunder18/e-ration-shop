import { Request, Response } from 'express';
import Cart from '../models/Cart';
import Product from '../models/Product';
import mongoose from 'mongoose';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private/User
export const getCart = async (req: Request, res: Response) => {
    try {
        let cart = await Cart.findOne({ user: req.user?._id }).populate('items.product');

        if (!cart) {
            cart = await Cart.create({ user: req.user?._id, items: [] });
        }

        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add item to cart or update quantity
// @route   POST /api/cart
// @access  Private/User
export const addToCart = async (req: Request, res: Response) => {
    const { productId, quantity } = req.body;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }

        let cart = await Cart.findOne({ user: req.user?._id });

        if (!cart) {
            cart = await Cart.create({
                user: req.user?._id,
                items: [{ product: productId, quantity }],
            });
        } else {
            // Check if product already exists in cart
            const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

            if (itemIndex > -1) {
                // Product exists, update quantity
                if (quantity === 0) {
                    // Remove item if quantity is 0
                    cart.items.splice(itemIndex, 1);
                } else {
                    cart.items[itemIndex].quantity = quantity;
                }
            } else {
                // Product does not exist, push new item
                if (quantity > 0) {
                    cart.items.push({ product: new mongoose.Types.ObjectId(productId), quantity } as any);
                }
            }
            await cart.save();
        }

        // Repopulate for response
        cart = await cart.populate('items.product');
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
