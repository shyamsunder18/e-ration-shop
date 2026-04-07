import CentralStock from '../models/CentralStock';

const monthlyStockTemplate = [
    { commodityKey: 'rice', commodityName: 'Rice', unit: 'kg', monthlyQuota: 3000 },
    { commodityKey: 'wheat', commodityName: 'Wheat', unit: 'kg', monthlyQuota: 1000 },
    { commodityKey: 'sugar', commodityName: 'Sugar', unit: 'kg', monthlyQuota: 1000 },
    { commodityKey: 'kerosene', commodityName: 'Kerosene', unit: 'L', monthlyQuota: 1000 },
];

const currentMonthKey = () => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
};

export const ensureMonthlyCentralStock = async () => {
    const monthKey = currentMonthKey();

    for (const item of monthlyStockTemplate) {
        const existing = await CentralStock.findOne({ commodityKey: item.commodityKey });

        if (!existing) {
            await CentralStock.create({
                ...item,
                availableQuantity: item.monthlyQuota,
                monthKey,
            });
            continue;
        }

        existing.commodityName = item.commodityName;
        existing.unit = item.unit;
        existing.monthlyQuota = item.monthlyQuota;

        if (existing.monthKey !== monthKey) {
            existing.monthKey = monthKey;
            existing.availableQuantity = item.monthlyQuota;
        }

        await existing.save();
    }

    return CentralStock.find({}).sort({ commodityName: 1 });
};

export const deductCentralStock = async (commodityKey: string, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error('Quantity must be greater than zero');
    }

    await ensureMonthlyCentralStock();
    const stock = await CentralStock.findOne({ commodityKey });

    if (!stock) {
        throw new Error('Central stock not configured');
    }

    if (stock.availableQuantity < quantity) {
        throw new Error(`Insufficient admin stock for ${stock.commodityName}. Remaining ${stock.availableQuantity} ${stock.unit}.`);
    }

    stock.availableQuantity -= quantity;
    await stock.save();
    return stock;
};
