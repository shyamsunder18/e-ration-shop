import { Request, Response } from 'express';
import Complaint from '../models/Complaint';

// @desc    Create a complaint
// @route   POST /api/complaints
// @access  Private
export const createComplaint = async (req: Request, res: Response) => {
    const { subject, description } = req.body;

    try {
        const complaint = await Complaint.create({
            user: req.user?._id,
            subject,
            description,
        });

        res.status(201).json(complaint);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get my complaints
// @route   GET /api/complaints/me
// @access  Private
export const getMyComplaints = async (req: Request, res: Response) => {
    try {
        const complaints = await Complaint.find({ user: req.user?._id });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
