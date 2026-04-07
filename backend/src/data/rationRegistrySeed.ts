import { RationCardType } from '../models/RationCard';

type SeedMember = {
    name: string;
    age: number;
    relationshipToHead: string;
    aadhaarNumber: string;
    biometricReference?: string;
};

type SeedCard = {
    rationCardNumber: string;
    dist: string;
    headOfFamilyName: string;
    headAadhaarNumber: string;
    cardType: RationCardType;
    addressLine: string;
    district: string;
    state: string;
    dealerAssigned: string;
    riceQuota: number;
    wheatQuota: number;
    sugarQuota: number;
    members: SeedMember[];
};

const maleFirstNames = ['Arun', 'Ravi', 'Suresh', 'Kiran', 'Harish', 'Vikram', 'Nitin', 'Ajay', 'Mohan', 'Prakash', 'Naveen', 'Ramesh', 'Deepak', 'Gautam', 'Karthik'];
const femaleFirstNames = ['Sita', 'Lakshmi', 'Anita', 'Meena', 'Pooja', 'Kavya', 'Rani', 'Geetha', 'Swathi', 'Neha', 'Divya', 'Shreya', 'Aparna', 'Radhika', 'Nandini'];
const lastNames = ['Reddy', 'Sharma', 'Rao', 'Naidu', 'Patel', 'Singh', 'Gupta', 'Verma', 'Iyer', 'Saxena', 'Mishra', 'Agarwal', 'Kumar', 'Yadav', 'Chowdary'];
const districts = ['Hyderabad', 'Rangareddy', 'Medchal-Malkajgiri', 'Nalgonda', 'Warangal', 'Khammam', 'Karimnagar', 'Nizamabad', 'Mahabubnagar', 'Siddipet'];
const localities = ['Main Street', 'Market Road', 'Temple Lane', 'Railway Colony', 'Teachers Colony', 'New Bazar', 'Old Town Road', 'Lake View Colony', 'Canal Street', 'Park Avenue'];
const dealers = ['sami@gmail.com', 'dealer.one@gov.in', 'dealer.two@gov.in'];
const familySizeWeights = [4, 4, 4, 4, 4, 3, 4, 5, 4, 3, 4, 2, 4, 5, 4, 6, 4, 3, 4, 5];
const cardTypeWeights = [
    RationCardType.BPL,
    RationCardType.APL,
    RationCardType.PHH,
    RationCardType.AAY,
    RationCardType.BPL,
    RationCardType.APL,
    RationCardType.PHH,
];

const pick = <T>(list: T[], seed: number): T => list[seed % list.length];
const districtCode = (district: string): string => district.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();

const makeAadhaar = (cardIndex: number, memberIndex: number): string => {
    const value = 700000000000 + cardIndex * 10 + memberIndex;
    return String(value).padStart(12, '0');
};

const buildMembers = (size: number, cardIndex: number, surname: string, headIsMale: boolean): SeedMember[] => {
    const members: SeedMember[] = [];
    const headFirst = pick(headIsMale ? maleFirstNames : femaleFirstNames, cardIndex);
    const spouseFirst = pick(headIsMale ? femaleFirstNames : maleFirstNames, cardIndex + 3);
    const headAge = 34 + (cardIndex % 21);
    const spouseAge = Math.max(22, headAge - ((cardIndex % 6) + 1));

    members.push({
        name: `${headFirst} ${surname}`,
        age: headAge,
        relationshipToHead: 'Head',
        aadhaarNumber: makeAadhaar(cardIndex, 1),
        biometricReference: `BIO-TG${(10000 + cardIndex).toString()}-H`,
    });

    if (size >= 2) {
        members.push({
            name: `${spouseFirst} ${surname}`,
            age: spouseAge,
            relationshipToHead: 'Spouse',
            aadhaarNumber: makeAadhaar(cardIndex, 2),
        });
    }

    if (size >= 3) {
        members.push({
            name: `${pick(cardIndex % 2 === 0 ? maleFirstNames : femaleFirstNames, cardIndex + 7)} ${surname}`,
            age: 18 - (cardIndex % 7),
            relationshipToHead: cardIndex % 2 === 0 ? 'Son' : 'Daughter',
            aadhaarNumber: makeAadhaar(cardIndex, 3),
        });
    }

    if (size >= 4) {
        members.push({
            name: `${pick(cardIndex % 2 === 0 ? femaleFirstNames : maleFirstNames, cardIndex + 11)} ${surname}`,
            age: 14 - (cardIndex % 6),
            relationshipToHead: cardIndex % 2 === 0 ? 'Daughter' : 'Son',
            aadhaarNumber: makeAadhaar(cardIndex, 4),
        });
    }

    if (size >= 5) {
        members.push({
            name: `${pick(headIsMale ? femaleFirstNames : maleFirstNames, cardIndex + 13)} ${surname}`,
            age: 60 + (cardIndex % 11),
            relationshipToHead: headIsMale ? 'Mother' : 'Father',
            aadhaarNumber: makeAadhaar(cardIndex, 5),
        });
    }

    if (size >= 6) {
        members.push({
            name: `${pick(cardIndex % 2 === 0 ? maleFirstNames : femaleFirstNames, cardIndex + 17)} ${surname}`,
            age: 9 + (cardIndex % 5),
            relationshipToHead: cardIndex % 2 === 0 ? 'Son' : 'Daughter',
            aadhaarNumber: makeAadhaar(cardIndex, 6),
        });
    }

    return members;
};

const buildCard = (index: number): SeedCard => {
    const familySize = pick(familySizeWeights, index);
    const cardType = pick(cardTypeWeights, index);
    const surname = pick(lastNames, index);
    const district = pick(districts, index);
    const locality = pick(localities, index + 2);
    const headIsMale = index % 3 !== 0;
    const members = buildMembers(familySize, index, surname, headIsMale);
    const head = members[0];

    const riceQuota = cardType === RationCardType.AAY || cardType === RationCardType.BPL
        ? 4 * familySize
        : cardType === RationCardType.PHH
            ? 5 * familySize
            : 0;
    const wheatQuota = cardType === RationCardType.AAY || cardType === RationCardType.PHH
        ? 2 * familySize
        : cardType === RationCardType.BPL
            ? 1 * familySize
            : 0;
    const sugarQuota = cardType === RationCardType.AAY || cardType === RationCardType.PHH
        ? 1 * familySize
        : cardType === RationCardType.BPL
            ? 0.5 * familySize
            : 0;

    return {
        rationCardNumber: `TG${(10000 + index).toString()}`,
        dist: `DIST-${districtCode(district)}-${String(index).padStart(3, '0')}`,
        headOfFamilyName: head.name,
        headAadhaarNumber: head.aadhaarNumber,
        cardType,
        addressLine: `${(index % 89) + 1} ${locality}, Ward ${(index % 12) + 1}`,
        district,
        state: 'Telangana',
        dealerAssigned: pick(dealers, index),
        riceQuota,
        wheatQuota,
        sugarQuota,
        members,
    };
};

const cards: SeedCard[] = Array.from({ length: 100 }, (_, idx) => buildCard(idx + 1));

export default cards;
