import { Injectable, Logger } from '@nestjs/common';
import { PineconeStore } from '@langchain/pinecone';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';
import { ChatGroq } from '@langchain/groq';
import { TavilySearch } from '@langchain/tavily'; 
import { getPineconeClient } from '../config/pinecone.config';

export interface RagResponse {
  question: string;
  answer: string;
  sources: { content: string; source: string; score: number; type: 'document' | 'web' }[];
  topK: number;
  latencyMs: number;
  hasEvidence: boolean;
  webResultsUsed: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  private getEmbeddings() {
    return new HuggingFaceTransformersEmbeddings({
      model: 'Xenova/all-MiniLM-L6-v2',
    });
  }

  private getLLM() {
    return new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
    });
  }

private getTavily() {
  return new TavilySearch({
    maxResults: 3,
  });
}

  async query(question: string, topK?: number): Promise<RagResponse> {
    const k = topK ?? Number(process.env.TOP_K ?? 3);
    const start = Date.now();

    // 1. Buscar en documentos propios (Pinecone)
    const pinecone = await getPineconeClient();
    const index = pinecone.Index(process.env.PINECONE_INDEX!);
    const embeddings = this.getEmbeddings();
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index });
    const queryVector = await embeddings.embedQuery(question);
    const docResults = await vectorStore.similaritySearchVectorWithScore(queryVector, k);

    const MIN_SCORE = 0.3;
    const validDocResults = docResults.filter(([, score]) => score >= MIN_SCORE);

    // 2. Buscar en la web con Tavily
 // 2. Buscar en la web con Tavily
let webResults: { content: string; source: string }[] = [];
try {
  const tavily = this.getTavily();
  const rawWeb = await tavily.invoke({ query: question });
  const parsed = typeof rawWeb === 'string' ? JSON.parse(rawWeb) : rawWeb;
  const items = Array.isArray(parsed) ? parsed : (parsed.results ?? parsed.data ?? []);
  webResults = items.slice(0, 3).map((r: any) => ({
    content: r.content ?? r.snippet ?? '',
    source: r.url ?? r.source ?? 'web',
  }));
  this.logger.log(`Tavily raw keys: ${Object.keys(parsed).join(', ')}`);
  this.logger.log(`Tavily first result keys: ${Object.keys(items[0] ?? {}).join(', ')}`);
  this.logger.log(`Web results: ${webResults.length}`);
} catch (e: any) {
  this.logger.warn(`Tavily search failed: ${e.message}`);
}

const hasEvidence = validDocResults.length > 0 || webResults.length > 0;
    // 3. Construir contexto combinado
    const docContext = validDocResults
      .map(([doc, score], i) =>
        `[DOC-${i + 1}] Fuente: "${doc.metadata.source}" (relevancia: ${score.toFixed(2)})\n${doc.pageContent}`)
      .join('\n\n---\n\n');

    const webContext = webResults
      .map((r, i) => `[WEB-${i + 1}] Fuente: "${r.source}"\n${r.content}`)
      .join('\n\n---\n\n');

    const context = [docContext, webContext].filter(Boolean).join('\n\n=== FUENTES WEB ===\n\n');

    // 4. Prompt híbrido
    const prompt = hasEvidence
      ? `Eres un asistente experto. Responde usando tanto los documentos internos como las fuentes web proporcionadas.
- Cita documentos internos con [DOC-1], [DOC-2], etc.
- Cita fuentes web con [WEB-1], [WEB-2], etc.
- Prioriza los documentos internos si hay conflicto.
- Responde en español de forma clara y concisa.

Contexto:
${context}

Pregunta: ${question}

Respuesta:`
      : `No tienes información suficiente sobre: "${question}". Responde educadamente que no tienes evidencia sobre este tema.`;

    // 5. Generar respuesta
    const llm = this.getLLM();
    const response = await llm.invoke(prompt);
    const latencyMs = Date.now() - start;
    this.logger.log(`Query respondida en ${latencyMs}ms`);

    // 6. Combinar fuentes para la respuesta
    const allSources = [
      ...docResults.map(([doc, score]) => ({
        content: doc.pageContent,
        source: doc.metadata.source,
        score: Number(score.toFixed(4)),
        type: 'document' as const,
      })),
      ...webResults.map((r) => ({
        content: r.content,
        source: r.source,
        score: 1.0,
        type: 'web' as const,
      })),
    ];

    return {
      question,
      answer: response.content as string,
      sources: allSources,
      topK: k,
      latencyMs,
      hasEvidence,
      webResultsUsed: webResults.length,
    };
  }
}