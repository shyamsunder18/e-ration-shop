import User, { UserRole, VendorStatus } from './models/User';
import bcrypt from 'bcryptjs';
import RationRegistry from './models/RationRegistry';
import RationCard from './models/RationCard';
import Product from './models/Product';
import rationRegistrySeed from './data/rationRegistrySeed';
import { ensureMonthlyCentralStock } from './utils/centralStock';

const telanganaDistricts = [
    'Hyderabad',
    'Rangareddy',
    'Medchal-Malkajgiri',
    'Nalgonda',
    'Warangal',
    'Khammam',
    'Karimnagar',
    'Nizamabad',
    'Mahabubnagar',
    'Siddipet',
];

const andhraToTelanganaDistrictMap: Record<string, string> = {
    Anantapur: 'Mahabubnagar',
    Guntur: 'Nalgonda',
    Kurnool: 'Siddipet',
    Ongole: 'Warangal',
    Tirupati: 'Rangareddy',
    Chittoor: 'Medchal-Malkajgiri',
    Nellore: 'Khammam',
    Vizag: 'Hyderabad',
    Srikakulam: 'Nizamabad',
    Vijayawada: 'Karimnagar',
};

const normalizedDistrict = (district?: string): string => {
    const clean = (district || '').trim();
    if (!clean) return telanganaDistricts[0];
    if (telanganaDistricts.includes(clean)) return clean;
    if (andhraToTelanganaDistrictMap[clean]) return andhraToTelanganaDistrictMap[clean];

    // Deterministic fallback for unexpected district values
    const sum = clean.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return telanganaDistricts[sum % telanganaDistricts.length];
};

type DistrictDealer = {
    id: string;
    email: string;
};

const districtSlug = (district: string): string =>
    district.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10);

const ensureDistrictDealers = async (): Promise<Record<string, DistrictDealer>> => {
    const districtDealers: Record<string, DistrictDealer> = {};
    const salt = await bcrypt.genSalt(10);

    for (let i = 0; i < telanganaDistricts.length; i++) {
        const district = telanganaDistricts[i];

        let dealer = await User.findOne({
            role: UserRole.VENDOR,
            district,
            status: VendorStatus.APPROVED,
        }).sort({ createdAt: 1 });

        if (!dealer) {
            let selectedEmail = '';
            let attempt = 0;

            while (attempt < 20) {
                const suffix = attempt === 0 ? '' : String(attempt);
                const candidateEmail = `dealer.${districtSlug(district)}${suffix}@gov.in`;
                const existing = await User.findOne({ email: candidateEmail });

                if (!existing) {
                    selectedEmail = candidateEmail;
                    break;
                }

                if (existing.role === UserRole.VENDOR) {
                    dealer = existing;
                    break;
                }

                attempt += 1;
            }

            if (!dealer) {
                if (!selectedEmail) {
                    selectedEmail = `dealer.${districtSlug(district)}${Date.now()}@gov.in`;
                }

                const hashedPassword = await bcrypt.hash('dealer123', salt);
                dealer = await User.create({
                    name: `${district} District Dealer`,
                    email: selectedEmail,
                    password: hashedPassword,
                    role: UserRole.VENDOR,
                    status: VendorStatus.APPROVED,
                    shopName: `${district} Fair Price Shop`,
                    licenseNumber: `LIC-${district.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
                    state: 'Telangana',
                    district,
                    mobileNumber: `9${String(800000000 + i).padStart(9, '0')}`,
                });
            }
        } else if (dealer.state !== 'Telangana') {
            dealer.state = 'Telangana';
            await dealer.save();
        }

        districtDealers[district] = {
            id: String(dealer._id),
            email: dealer.email,
        };
    }

    console.log(`District dealer check complete. Telangana districts mapped: ${Object.keys(districtDealers).length}.`);
    return districtDealers;
};

const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: UserRole.ADMIN });

        if (adminExists) {
            console.log('Admin user already exists.');
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt); // Default password

        await User.create({
            name: 'Government Admin',
            email: 'admin@gov.in',
            password: hashedPassword,
            role: UserRole.ADMIN,
            status: VendorStatus.APPROVED, // Admins are always approved/active
            mobileNumber: '9999999999'
        });

        console.log('Admin user seeded successfully. Email: admin@gov.in, Password: admin123');
    } catch (error) {
        console.error('Error seeding admin user:', error);
    }
};

const seedRationRegistry = async (districtDealers: Record<string, DistrictDealer>) => {
    try {
        let inserted = 0;

        for (const card of rationRegistrySeed) {
            const result = await RationRegistry.updateOne(
                { rationCardNumber: card.rationCardNumber },
                { $setOnInsert: card },
                { upsert: true }
            );
            if (result.upsertedCount > 0) inserted += 1;
        }

        // Normalize legacy records so state and district are Telangana-compliant.
        const allRegistryRows = await RationRegistry.find({}).select('_id district rationCardNumber dist state');
        for (const row of allRegistryRows) {
            const nextDistrict = normalizedDistrict((row as any).district);
            const rc = (row as any).rationCardNumber || 'TG00000';
            const districtCode = String(nextDistrict).replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'UNK';
            const serial = String(rc).replace(/[^0-9]/g, '').slice(-3).padStart(3, '0');
            const nextDistId = `DIST-${districtCode}-${serial}`;
            const districtDealerEmail = districtDealers[nextDistrict]?.email || 'dealer.telangana@gov.in';

            await RationRegistry.updateOne({ _id: row._id }, {
                $set: {
                    state: 'Telangana',
                    district: nextDistrict,
                    dist: nextDistId,
                    dealerAssigned: districtDealerEmail,
                }
            });
        }

        // Keep user/ration-card docs aligned with Telangana districts too.
        const usersToFix = await User.find({ role: UserRole.USER }).select('_id district state assignedVendor');
        for (const user of usersToFix) {
            const nextDistrict = normalizedDistrict((user as any).district);
            const districtDealerId = districtDealers[nextDistrict]?.id;
            await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        state: 'Telangana',
                        district: nextDistrict,
                        ...(districtDealerId && !(user as any).assignedVendor ? { assignedVendor: districtDealerId } : {}),
                    },
                }
            );
        }

        const cardsToFix = await RationCard.find({}).select('_id district state');
        for (const card of cardsToFix) {
            await RationCard.updateOne(
                { _id: card._id },
                { $set: { state: 'Telangana', district: normalizedDistrict((card as any).district) } }
            );
        }

        const total = await RationRegistry.countDocuments({});
        console.log(`Ration registry seed check complete. Added ${inserted} new record(s). Total records: ${total}.`);
    } catch (error) {
        console.error('Error seeding ration registry:', error);
    }
};

const seedProducts = async () => {
    try {
        const legacyAata = await Product.findOne({ name: 'Aata' });
        const existingWheat = await Product.findOne({ name: 'Wheat' });

        if (legacyAata && !existingWheat) {
            legacyAata.name = 'Wheat';
            legacyAata.description = 'Public distribution wheat allocation';
            legacyAata.unit = 'kg';
            if (!legacyAata.price && legacyAata.price !== 0) {
                legacyAata.price = 24;
            }
            await legacyAata.save();
        } else if (legacyAata && existingWheat) {
            await Product.deleteOne({ _id: legacyAata._id });
        }

        const defaultProducts = [
            {
                name: 'Rice',
                description: 'Public distribution rice allocation',
                unit: 'kg',
                price: 0,
            },
            {
                name: 'Wheat',
                description: 'Public distribution wheat allocation',
                unit: 'kg',
                price: 24,
            },
            {
                name: 'Sugar',
                description: 'Public distribution sugar allocation',
                unit: 'kg',
                price: 20,
            },
            {
                name: 'Kerosene',
                description: 'Public distribution kerosene allocation',
                unit: 'L',
                price: 18,
            },
        ];

        for (const product of defaultProducts) {
            await Product.updateOne(
                { name: product.name },
                { $set: product },
                { upsert: true }
            );
        }

        console.log(`Product seed check complete. Total products: ${await Product.countDocuments({})}.`);
    } catch (error) {
        console.error('Error seeding products:', error);
    }
};

const seedData = async () => {
    await seedAdmin();
    const districtDealers = await ensureDistrictDealers();
    await seedRationRegistry(districtDealers);
    await seedProducts();
    const centralStock = await ensureMonthlyCentralStock();
    console.log(`Central stock check complete. Commodities tracked: ${centralStock.length}.`);
};

export default seedData;
