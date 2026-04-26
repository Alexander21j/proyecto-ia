import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`\n RAG Project corriendo en http://localhost:${port}/api`);
  console.log(`  POST /api/ingestion/text`);
  console.log(`  POST /api/ingestion/batch`);
  console.log(`  POST /api/rag/query`);
  console.log(`  GET  /api/rag/health`);
  console.log(`  POST /api/evaluation/run\n`);
}
bootstrap();