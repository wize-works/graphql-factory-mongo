import { MongoClient } from 'mongodb';
import { createFactoryAuthContext } from '../lib/authContext';

export const createServerContext = async (request: Request, mongo: MongoClient) => {
    const apiKey = request.headers.get('wize-api-key');
    if (!apiKey) throw new Error('Missing Wize API key');
    return createFactoryAuthContext(mongo, apiKey);
};
