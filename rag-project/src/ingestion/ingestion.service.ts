import { Injectable, Logger } from '@nestjs/common';
import { PineconeStore } from '@langchain/pinecone';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';
import { getPineconeClient } from '../config/pinecone.config';
import pdfParse = require('pdf-parse');

export interface IngestResult {
  fileName: string;
  chunksCreated: number;
  chunkSize: number;
  chunkOverlap: number;
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  private getEmbeddings() {
    return new HuggingFaceTransformersEmbeddings({
      model: 'Xenova/all-MiniLM-L6-v2',
    });
  }

  private getSplitter(chunkSize?: number, chunkOverlap?: number) {
    return new RecursiveCharacterTextSplitter({
      chunkSize: chunkSize ?? Number(process.env.CHUNK_SIZE ?? 300),
      chunkOverlap: chunkOverlap ?? Number(process.env.CHUNK_OVERLAP ?? 50),
    });
  }

  async ingestText(content: string, source: string, chunkSize?: number, chunkOverlap?: number): Promise<IngestResult> {
    const size = chunkSize ?? Number(process.env.CHUNK_SIZE ?? 300);
    const overlap = chunkOverlap ?? Number(process.env.CHUNK_OVERLAP ?? 50);
    const splitter = this.getSplitter(size, overlap);

    const rawDoc = new Document({
      pageContent: content,
      metadata: { source, ingestedAt: new Date().toISOString() },
    });

    const chunks = await splitter.splitDocuments([rawDoc]);
    this.logger.log(`[${source}] → ${chunks.length} chunks`);

    await this.saveToVectorStore(chunks);
    return { fileName: source, chunksCreated: chunks.length, chunkSize: size, chunkOverlap: overlap };
  }

  async ingestPdf(buffer: Buffer, fileName: string, chunkSize?: number, chunkOverlap?: number): Promise<IngestResult> {
    const parsed = await (pdfParse as any)(buffer);
    return this.ingestText(parsed.text, fileName, chunkSize, chunkOverlap);
  }

  async ingestBatch(docs: { content: string; source: string }[], chunkSize?: number, chunkOverlap?: number): Promise<IngestResult[]> {
    const results: IngestResult[] = [];
    for (const doc of docs) {
      const result = await this.ingestText(doc.content, doc.source, chunkSize, chunkOverlap);
      results.push(result);
    }
    return results;
  }

  private async saveToVectorStore(chunks: Document[]) {
    const pinecone = await getPineconeClient();
    const index = pinecone.Index(process.env.PINECONE_INDEX!);
    await PineconeStore.fromDocuments(chunks, this.getEmbeddings(), { pineconeIndex: index });
  }

  async clearIndex(): Promise<{ message: string }> {
    const pinecone = await getPineconeClient();
    const index = pinecone.Index(process.env.PINECONE_INDEX!);
    await index.deleteAll();
    return { message: 'Index cleared successfully' };
  }
}