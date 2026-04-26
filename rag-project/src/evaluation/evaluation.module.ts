import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [RagModule],
  controllers: [EvaluationController],
  providers: [EvaluationService],
})
export class EvaluationModule {}