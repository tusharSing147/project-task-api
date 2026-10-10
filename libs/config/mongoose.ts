import mongoose from 'mongoose';

const globalForMongoose = globalThis as unknown as {
    mongooseConnecting: Promise<typeof mongoose> | undefined;
};

export function connectMongo(): Promise<typeof mongoose> {
    if (globalForMongoose.mongooseConnecting) {
        return globalForMongoose.mongooseConnecting;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        return Promise.reject(new Error('MONGODB_URI is not set'));
    }

    const promise = mongoose
        .connect(uri)
        .then(() => {
            console.log('MongoDB connected');
            return mongoose;
        })
        .catch((err) => {
            globalForMongoose.mongooseConnecting = undefined;
            console.error('MongoDB connection error:', err.message);
            throw err;
        });

    globalForMongoose.mongooseConnecting = promise;
    return promise;
}

export function isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
}
