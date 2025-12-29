import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function debugDB() {
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is missing');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        console.log('Database Name:', mongoose.connection.name);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📚 Collections found:', collections.map(c => c.name));

        const collectionName = collections.find(c => c.name.includes('product'))?.name || 'products';
        console.log(`🔍 Inspecting collection: ${collectionName}`);

        const collection = mongoose.connection.db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`📊 Total products in collection: ${count}`);

        if (count > 0) {
            const sample = await collection.findOne({});
            console.log('🔍 Sample Product Raw Data:');
            console.log(JSON.stringify(sample, null, 2));
            console.log('🔍 Keys:', Object.keys(sample || {}));
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

debugDB();
