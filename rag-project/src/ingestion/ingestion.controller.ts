import { Controller, Post, Body, UploadedFile, UseInterceptors, Delete, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IngestionService } from './ingestion.service';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('text')
  async ingestText(@Body() body: { content: string; source: string; chunkSize?: number; chunkOverlap?: number }) {
    return this.ingestionService.ingestText(body.content, body.source, body.chunkSize, body.chunkOverlap);
  }

  @Post('pdf')
  @UseInterceptors(FileInterceptor('file'))
  async ingestPdf(@UploadedFile() file: any, @Query('chunkSize') chunkSize?: string) {
    return this.ingestionService.ingestPdf(file.buffer, file.originalname, chunkSize ? Number(chunkSize) : undefined);
  }

  @Post('batch')
  async ingestBatch(@Body() body: { docs: { content: string; source: string }[]; chunkSize?: number }) {
    return this.ingestionService.ingestBatch(body.docs, body.chunkSize);
  }

  @Delete('clear')
  async clearIndex() {
    return this.ingestionService.clearIndex();
  }
}