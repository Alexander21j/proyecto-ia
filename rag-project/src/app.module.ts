import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IngestionModule } from './ingestion/ingestion.module';
import { RagModule } from './rag/rag.module';
import { EvaluationModule } from './evaluation/evaluation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    IngestionModule,
    RagModule,
    EvaluationModule,
  ],
})
export class AppModule {}