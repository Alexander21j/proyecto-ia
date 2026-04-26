import { Controller, Post, Body } from '@nestjs/common';
import { EvaluationService, GoldenItem } from './evaluation.service';

@Controller('evaluation')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post('run')
  async run(@Body() body: { goldenSet: GoldenItem[]; topK?: number }) {
    return this.evaluationService.evaluateAll(body.goldenSet, body.topK);
  }
}