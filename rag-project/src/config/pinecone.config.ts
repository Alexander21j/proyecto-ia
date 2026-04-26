import { Pinecone } from '@pinecone-database/pinecone';

let client: Pinecone | null = null;

export const getPineconeClient = async (): Promise<Pinecone> => {
  if (!client) {
    client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return client;
};