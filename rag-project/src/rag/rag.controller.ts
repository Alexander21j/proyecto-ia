import { Controller, Post, Body, Get } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('query')
  async query(@Body() body: { question: string; topK?: number }) {
    return this.ragService.query(body.question, body.topK);
  }

  @Get('health')
  health() {
    return { status: 'ok', index: process.env.PINECONE_INDEX, topK: process.env.TOP_K };
  }
}