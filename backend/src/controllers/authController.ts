import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User, { UserRole, VendorStatus } from '../models/User';
import generateToken from '../utils/token';
import bcrypt from 'bcryptjs';
import RationCard, { RationCardType } from '../models/RationCard';
import RationRegistry from '../models/RationRegistry';
import { createNotification, createNotifications } from '../utils/notifications';

const toRationCardType = (value?: string): RationCardType => {
    if (value === RationCardType.AAY) return RationCardType.AAY;
    if (value === RationCardType.BPL) return RationCardType.BPL;
    if (value === RationCardType.PHH) return RationCardType.PHH;
    return RationCardType.APL;
};

// @desc    Register a new user (User or Vendor)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
    const { name, email, password, role, licenseNumber, shopName, rationCardNumber, address, mobileNumber, state, district, familyMembers, aadhaar, relationshipToHead } = req.body;
    let createdUserId: string | null = null;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        // Validation for mandatory fields (citizens are resolved from registry)
        if (role !== UserRole.USER && (!state || !district)) {
            res.status(400).json({ message: 'State and District are mandatory for all registrations' });
            return;
        }

        if (role === UserRole.USER && !rationCardNumber) {
            res.status(400).json({ message: 'Ration Card Number is mandatory for Citizens' });
            return;
        }
        if (role === UserRole.USER && !aadhaar) {
            res.status(400).json({ message: 'Aadhaar is mandatory for Citizens' });
            return;
        }

        if (role === UserRole.VENDOR && (!licenseNumber || !shopName)) {
            res.status(400).json({ message: 'License number and Shop name are required for Vendors' });
            return;
        }

        let registryCard: any = null;
        let assignedVendor: any = null;
        if (role === UserRole.USER) {
            registryCard = await RationRegistry.findOne({ rationCardNumber });
            if (!registryCard) {
                const admins = await User.find({ role: UserRole.ADMIN }).select('_id');
                await createNotifications(
                    admins.map((admin) => ({
                        user: admin._id,
                        title: 'Registration mismatch',
                        message: `A registration attempt for ${email} used ration card ${rationCardNumber}, but no registry record was found.`,
                        type: 'REGISTRATION_MISMATCH',
                        priority: 'high',
                        actionUrl: '/admin-dashboard/ration-cards',
                        metadata: { email, rationCardNumber, reason: 'RATION_CARD_NOT_FOUND' },
                    }))
                );
                res.status(400).json({ message: 'Ration card not found in government registry. Please contact admin.' });
                return;
            }

            assignedVendor = await User.findOne({ email: registryCard.dealerAssigned, role: UserRole.VENDOR }).select('_id email shopName');

            const matchingMember = registryCard.members.find((member: any) => member.aadhaarNumber === aadhaar);
            const isHead = registryCard.headAadhaarNumber === aadhaar;

            if (!matchingMember && !isHead) {
                const admins = await User.find({ role: UserRole.ADMIN }).select('_id');
                await createNotifications(
                    admins.map((admin) => ({
                        user: admin._id,
                        title: 'Registration mismatch',
                        message: `A registration attempt for ${email} used Aadhaar ${aadhaar}, but it does not match ration card ${rationCardNumber}.`,
                        type: 'REGISTRATION_MISMATCH',
                        priority: 'high',
                        actionUrl: '/admin-dashboard/users',
                        metadata: { email, rationCardNumber, aadhaar, reason: 'AADHAAR_MISMATCH' },
                    }))
                );
                res.status(400).json({ message: 'Provided Aadhaar does not match this ration card in registry.' });
                return;
            }

            const registryName = isHead ? registryCard.headOfFamilyName : matchingMember.name;
            const registryRelation = isHead ? 'Head' : matchingMember.relationshipToHead;

            if (name && String(name).trim().toLowerCase() !== String(registryName).trim().toLowerCase()) {
                const admins = await User.find({ role: UserRole.ADMIN }).select('_id');
                await createNotifications(
                    admins.map((admin) => ({
                        user: admin._id,
                        title: 'Registration mismatch',
                        message: `A registration attempt for ${email} provided a name that did not match registry details for ration card ${rationCardNumber}.`,
                        type: 'REGISTRATION_MISMATCH',
                        priority: 'high',
                        actionUrl: '/admin-dashboard/users',
                        metadata: { email, rationCardNumber, aadhaar, reason: 'NAME_MISMATCH' },
                    }))
                );
                res.status(400).json({ message: 'Name does not match registry record for this Aadhaar.' });
                return;
            }

            if (relationshipToHead && String(relationshipToHead).trim().toLowerCase() !== String(registryRelation).trim().toLowerCase()) {
                const admins = await User.find({ role: UserRole.ADMIN }).select('_id');
                await createNotifications(
                    admins.map((admin) => ({
                        user: admin._id,
                        title: 'Registration mismatch',
                        message: `A registration attempt for ${email} had a relationship mismatch for ration card ${rationCardNumber}.`,
                        type: 'REGISTRATION_MISMATCH',
                        priority: 'high',
                        actionUrl: '/admin-dashboard/users',
                        metadata: { email, rationCardNumber, aadhaar, reason: 'RELATIONSHIP_MISMATCH' },
                    }))
                );
                res.status(400).json({ message: 'Relationship does not match registry record.' });
                return;
            }

            if (familyMembers && Number(familyMembers) !== registryCard.members.length) {
                const admins = await User.find({ role: UserRole.ADMIN }).select('_id');
                await createNotifications(
                    admins.map((admin) => ({
                        user: admin._id,
                        title: 'Registration mismatch',
                        message: `A registration attempt for ${email} provided family count ${familyMembers}, but registry card ${rationCardNumber} has ${registryCard.members.length}.`,
                        type: 'REGISTRATION_MISMATCH',
                        priority: 'high',
                        actionUrl: '/admin-dashboard/users',
                        metadata: { email, rationCardNumber, reason: 'FAMILY_COUNT_MISMATCH' },
                    }))
                );
                res.status(400).json({ message: 'Family member count does not match registry record.' });
                return;
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const matchedRegistryMember = role === UserRole.USER
            ? registryCard.members.find((member: any) => member.aadhaarNumber === aadhaar)
            : null;
        const resolvedState = role === UserRole.USER ? registryCard.state : state;
        const resolvedDistrict = role === UserRole.USER ? registryCard.district : district;
        const resolvedAddress = role === UserRole.USER ? registryCard.addressLine : address;
        const resolvedName = role === UserRole.USER ? (name || matchedRegistryMember?.name || registryCard.headOfFamilyName) : name;
        const resolvedFamilyMembers = role === UserRole.USER ? registryCard.members.length : (familyMembers || 1);
        const resolvedAadhaar = role === UserRole.USER ? (aadhaar || registryCard.headAadhaarNumber) : aadhaar;
        const resolvedCategory = role === UserRole.USER ? registryCard.cardType : undefined;

        const user = await User.create({
            name: resolvedName,
            email,
            password: hashedPassword,
            role: role || UserRole.USER,
            status: role !== UserRole.ADMIN ? VendorStatus.PENDING : VendorStatus.APPROVED,
            licenseNumber,
            shopName,
            rationCardNumber,
            address: resolvedAddress,
            mobileNumber,
            state: resolvedState,
            district: resolvedDistrict,
            familyMembers: role === UserRole.USER ? resolvedFamilyMembers : undefined,
            aadhaar: resolvedAadhaar,
            cardCategory: resolvedCategory,
            assignedVendor: role === UserRole.USER && assignedVendor ? assignedVendor._id : undefined,
        });
        createdUserId = String(user._id);

        if (user.role === UserRole.USER) {
            await RationCard.findOneAndUpdate(
                { user: user._id },
                {
                    user: user._id,
                    headOfFamilyName: registryCard?.headOfFamilyName || user.name,
                    rationCardNumber: user.rationCardNumber || `RC-${Date.now()}`,
                    aadhaarNumber: registryCard?.headAadhaarNumber || user.aadhaar || '',
                    cardType: toRationCardType(registryCard?.cardType || user.cardCategory),
                    numberOfFamilyMembers: registryCard?.members?.length || user.familyMembers || 1,
                    addressLine: registryCard?.addressLine || user.address,
                    district: registryCard?.district || user.district,
                    state: registryCard?.state || user.state,
                    members: (registryCard?.members || []).map((member: any) => ({
                        name: member.name,
                        age: member.age,
                        relationshipToHead: member.relationshipToHead,
                        aadhaarNumber: member.aadhaarNumber,
                        biometricReference: member.biometricReference,
                    })),
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        const admins = await User.find({ role: UserRole.ADMIN }).select('_id');

        if (user.role === UserRole.USER) {
            await createNotifications(
                admins.map((admin) => ({
                    user: admin._id,
                    title: 'New citizen registration',
                    message: `${user.name} registered with ration card ${user.rationCardNumber} and is pending approval.`,
                    type: 'REGISTRATION_PENDING',
                    priority: 'medium',
                    actionUrl: '/admin-dashboard/users',
                    metadata: { userId: String(user._id), rationCardNumber: user.rationCardNumber },
                }))
            );

            await createNotification({
                user: user._id,
                title: 'Registration submitted',
                message: 'Your registration has been linked to the family ration card in the registry and is waiting for admin approval.',
                type: 'REGISTRATION_PENDING',
                priority: 'medium',
                actionUrl: '/citizen-dashboard/notifications',
                metadata: { rationCardNumber: user.rationCardNumber },
            });

        }

        if (user.role === UserRole.VENDOR) {
            await createNotifications(
                admins.map((admin) => ({
                    user: admin._id,
                    title: 'New dealer registration',
                    message: `${user.shopName || user.name} registered as a dealer and is pending approval.`,
                    type: 'DEALER_REGISTRATION_PENDING',
                    priority: 'medium',
                    actionUrl: '/admin-dashboard/dealers',
                    metadata: { userId: String(user._id), district: user.district },
                }))
            );
        }

        // Only generate token for Admin (Citizens/Vendors need admin approval)
        if (user.role === UserRole.ADMIN) {
            generateToken(res, (user._id as mongoose.Types.ObjectId).toString(), user.role);
        }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            state: user.state,
            district: user.district,
            rationCardNumber: user.rationCardNumber,
            familyMembers: user.familyMembers,
            aadhaar: user.aadhaar,
            shopName: user.shopName,
            licenseNumber: user.licenseNumber
        });
    } catch (error: any) {
        if (createdUserId) {
            await Promise.allSettled([
                User.findByIdAndDelete(createdUserId),
                RationCard.deleteMany({ user: createdUserId }),
            ]);
        }

        if (error?.code === 11000) {
            res.status(400).json({ message: 'Registration conflict detected. Please retry or contact admin.' });
            return;
        }

        console.error('Registration error:', error);
        res.status(500).json({ message: error?.message || 'Registration failed' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    console.log(`[Backend] Login attempt for: ${email}`);

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password || ''))) {

        // Status Check for non-admin
        if (user.role !== UserRole.ADMIN && user.status !== VendorStatus.APPROVED) {
            res.status(403).json({ message: `Account is ${user.status}. Please contact admin.` });
            return;
        }

        generateToken(res, (user._id as mongoose.Types.ObjectId).toString(), user.role);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            state: user.state,
            district: user.district,
            rationCardNumber: user.rationCardNumber,
            familyMembers: user.familyMembers,
            aadhaar: user.aadhaar,
            shopName: user.shopName,
            licenseNumber: user.licenseNumber,
            cardCategory: user.cardCategory,
            assignedVendor: user.assignedVendor
        });
    } else {
        console.log(user)
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = (req: Request, res: Response) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = async (req: Request, res: Response) => {
    const user = req.user;
    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            state: user.state,
            district: user.district,
            rationCardNumber: user.rationCardNumber,
            familyMembers: user.familyMembers,
            aadhaar: user.aadhaar,
            shopName: user.shopName,
            licenseNumber: user.licenseNumber,
            cardCategory: user.cardCategory,
            assignedVendor: user.assignedVendor
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Lookup ration card from pre-seeded registry for registration assist
// @route   GET /api/auth/ration-registry/:rationCardNumber
// @access  Public
export const lookupRationRegistry = async (req: Request, res: Response) => {
    try {
        const rationCardNumber = String(req.params.rationCardNumber || '').trim();
        if (!rationCardNumber) {
            res.status(400).json({ message: 'Ration card number is required' });
            return;
        }

        const card = await RationRegistry.findOne({ rationCardNumber });
        if (!card) {
            res.status(404).json({ message: 'Ration card not found in registry' });
            return;
        }

        res.json({
            rationCardNumber: card.rationCardNumber,
            dist: card.dist,
            headOfFamilyName: card.headOfFamilyName,
            cardType: card.cardType,
            district: card.district,
            state: card.state,
            numberOfFamilyMembers: card.members.length,
            members: card.members.map((member) => ({
                name: member.name,
                age: member.age,
                relationshipToHead: member.relationshipToHead,
                aadhaarNumber: member.aadhaarNumber,
            })),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
