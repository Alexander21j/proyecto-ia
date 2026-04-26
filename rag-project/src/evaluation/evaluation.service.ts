import { Injectable, Logger } from '@nestjs/common';
import { RagService } from '../rag/rag.service';

export interface GoldenItem {
  question: string;
  expectedSources: string[];
  expectedKeywords: string[];
}

export interface EvalResult {
  question: string;
  precisionAtK: number;
  recallAtK: number;
  faithfulness: number;
  latencyMs: number;
  retrievedSources: string[];
  answer: string;
}

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);
  constructor(private readonly ragService: RagService) {}

  private precisionAtK(retrieved: string[], expected: string[]): number {
    if (retrieved.length === 0) return 0;
    const hits = retrieved.filter(r => expected.some(e => r.toLowerCase().includes(e.toLowerCase())));
    return hits.length / retrieved.length;
  }

  private recallAtK(retrieved: string[], expected: string[]): number {
    if (expected.length === 0) return 1;
    const hits = expected.filter(e => retrieved.some(r => r.toLowerCase().includes(e.toLowerCase())));
    return hits.length / expected.length;
  }

  private faithfulness(answer: string, keywords: string[]): number {
    if (keywords.length === 0) return 1;
    return keywords.filter(kw => answer.toLowerCase().includes(kw.toLowerCase())).length / keywords.length;
  }

  async evaluateAll(goldenSet: GoldenItem[], topK?: number) {
    const k = topK ?? Number(process.env.TOP_K ?? 3);
    const results: EvalResult[] = [];

    for (const item of goldenSet) {
      const response = await this.ragService.query(item.question, k);
      const retrievedSources = response.sources.map(s => s.source);
      results.push({
        question: item.question,
        precisionAtK: this.precisionAtK(retrievedSources, item.expectedSources),
        recallAtK: this.recallAtK(retrievedSources, item.expectedSources),
        faithfulness: this.faithfulness(response.answer, item.expectedKeywords),
        latencyMs: response.latencyMs,
        retrievedSources,
        answer: response.answer,
      });
    }

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    return {
      config: { chunkSize: Number(process.env.CHUNK_SIZE), topK: k },
      results,
      avgPrecisionAtK: avg(results.map(r => r.precisionAtK)),
      avgRecallAtK: avg(results.map(r => r.recallAtK)),
      avgFaithfulness: avg(results.map(r => r.faithfulness)),
      avgLatencyMs: avg(results.map(r => r.latencyMs)),
    };
  }
}