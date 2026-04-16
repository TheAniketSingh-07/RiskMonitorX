import mongoose from 'mongoose';
import User from '../models/User.js';

const cleanupLegacyUserIndexes = async () => {
    try {
        const indexes = await User.collection.indexes();
        const hasLegacyUsernameIndex = indexes.some((index) => index.name === 'username_1');

        if (hasLegacyUsernameIndex) {
            await User.collection.dropIndex('username_1');
            console.log('Dropped legacy users index: username_1');
        }
    } catch (error) {
        // Ignore if collection does not yet exist.
        if (error.codeName !== 'NamespaceNotFound') {
            throw error;
        }
    }
};

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        await cleanupLegacyUserIndexes();
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        // Exit process with failure code if DB doesn't connect.
        process.exit(1); 
    }
};

export default connectDB;
