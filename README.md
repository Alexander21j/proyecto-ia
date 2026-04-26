# 🎓 Asistente IA Académico

Chatbot inteligente con **Retrieval-Augmented Generation (RAG)** diseñado para responder preguntas sobre temas de Inteligencia Artificial, Machine Learning y tecnologías relacionadas. Combina búsqueda en documentos académicos propios (Pinecone) con búsqueda web en tiempo real (Tavily), generando respuestas con el modelo **LLaMA 3.3 70B** a través de Groq.

---

## 📁 Estructura del proyecto

El proyecto está dividido en dos repositorios independientes:

```
├── rag-frontend/        # Interfaz de usuario (Next.js)
└── rag-project/         # API y lógica RAG (NestJS)
```

---

## 📐 Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│               rag-frontend (Next.js 16)                  │
│         chat-bot.tsx  +  shadcn/ui  +  axios             │
└─────────────────────┬───────────────────────────────────┘
                      │ POST /api/rag/query
┌─────────────────────▼───────────────────────────────────┐
│               rag-project (NestJS)                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │IngestionModule│ │  RagModule   │  │EvaluationModule│  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘  │
│         │                 │                  │           │
│    HuggingFace        Pinecone +         RagService      │
│    Embeddings         Tavily + Groq      (métricas)      │
└─────────────────────────────────────────────────────────┘
```

### Flujo de una consulta

1. El estudiante escribe una pregunta en el chat
2. Se generan embeddings con `Xenova/all-MiniLM-L6-v2` (HuggingFace)
3. Se buscan documentos académicos relevantes en **Pinecone** (vector DB)
4. Se complementa con resultados de **Tavily** (búsqueda web)
5. Se construye un prompt híbrido y se envía a **Groq (LLaMA 3.3 70B)**
6. La respuesta incluye citas a fuentes internas `[DOC-N]` y web `[WEB-N]`

---

## 📚 Documentos académicos incluidos

El sistema fue cargado con material de un curso de Inteligencia Artificial y Machine Learning:

| Documento | Temas cubiertos |
|---|---|
| `Clase_1.pdf` | Introducción a la IA, diferencias IA vs ML vs DL, pipeline de ML, tipos de problemas, riesgos y límites |
| `Clase_Intro_Machine_Learning.pdf` | ¿Qué es ML?, clasificación de sistemas (supervisado, no supervisado, batch, online), aprendizaje basado en instancias y modelos |
| `Redes_Neuronales_Artificiales.pdf` | Historia de las RNA, Perceptrón, TLU, funciones de activación, Perceptrón Multicapa, redes convolucionales y recurrentes |
| `Librerias_de_ML.pdf` | NumPy, Pandas, Matplotlib, Scikit-learn, TensorFlow, Keras |
| `Blockchain.pdf` | ¿Qué es blockchain?, red distribuida, hash, Proof of Work, agregado de bloques y transacciones |

---

## 🛠️ Stack tecnológico

### Frontend — `rag-frontend`

| Categoría | Tecnología |
|---|---|
| Framework | Next.js 16 + React 19 + TypeScript 5.7 |
| UI Components | shadcn/ui (estilo New York) + Radix UI |
| Estilos | Tailwind CSS v4 + tw-animate-css |
| Iconos | Lucide React |
| HTTP Client | Axios |
| Temas | next-themes |
| Formularios | React Hook Form + Zod |
| Gráficas | Recharts |

### Backend — `rag-project`

| Categoría | Tecnología |
|---|---|
| Framework | NestJS + TypeScript |
| LLM | Groq — `llama-3.3-70b-versatile` |
| Embeddings | HuggingFace — `Xenova/all-MiniLM-L6-v2` |
| Vector DB | Pinecone |
| Búsqueda web | Tavily |
| RAG framework | LangChain (`@langchain/core`, `@langchain/community`) |
| PDF parsing | `pdf-parse` |
| Subida de archivos | Multer |

---

## 🚀 Instalación y uso

### Requisitos previos

- Node.js 18+
- pnpm (frontend usa `pnpm-lock.yaml`)
- Cuenta en [Pinecone](https://www.pinecone.io/)
- Cuenta en [Groq](https://console.groq.com/)
- Cuenta en [Tavily](https://tavily.com/)

---

### 1. Backend — `rag-project`

```bash
cd rag-project

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys

# Modo desarrollo
npm run start:dev

# Producción
npm run build
npm run start
```

El servidor estará disponible en `http://localhost:3000/api`

---

### 2. Frontend — `rag-frontend`

```bash
cd rag-frontend

# Instalar dependencias
pnpm install

# Modo desarrollo
pnpm dev

# Producción
pnpm build
pnpm start
```

La interfaz estará disponible en `http://localhost:3001`

---

## ⚙️ Variables de entorno

Crea un archivo `.env` dentro de `rag-project/`:

```env
# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=your_index_name

# Groq
GROQ_API_KEY=your_groq_api_key

# Tavily
TAVILY_API_KEY=your_tavily_api_key

# RAG config
CHUNK_SIZE=300
CHUNK_OVERLAP=50
TOP_K=3

# Server
PORT=3000
```

---

## 📡 Endpoints de la API

### RAG

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/rag/query` | Realiza una consulta RAG híbrida |
| `GET` | `/api/rag/health` | Estado del servicio |

**Ejemplo de consulta:**
```json
POST /api/rag/query
{
  "question": "¿Qué es el aprendizaje supervisado?",
  "topK": 3
}
```

**Respuesta:**
```json
{
  "question": "¿Qué es el aprendizaje supervisado?",
  "answer": "Según [DOC-1], el aprendizaje supervisado es...",
  "sources": [
    { "content": "...", "source": "Clase_Intro_Machine_Learning.pdf", "score": 0.91, "type": "document" },
    { "content": "...", "source": "https://...", "score": 1.0, "type": "web" }
  ],
  "topK": 3,
  "latencyMs": 1240,
  "hasEvidence": true,
  "webResultsUsed": 2
}
```

---

### Ingestion

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/ingestion/text` | Ingesta texto plano |
| `POST` | `/api/ingestion/pdf` | Ingesta un archivo PDF |
| `POST` | `/api/ingestion/batch` | Ingesta múltiples documentos |
| `DELETE` | `/api/ingestion/clear` | Limpia el índice de Pinecone |

**Ejemplo — ingestar PDF:**
```
POST /api/ingestion/pdf
Content-Type: multipart/form-data
file: <archivo.pdf>
```

**Ejemplo — ingestar texto:**
```json
POST /api/ingestion/text
{
  "content": "Contenido del material académico...",
  "source": "apuntes-redes-neuronales.txt",
  "chunkSize": 300,
  "chunkOverlap": 50
}
```

---

### Evaluation

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/evaluation/run` | Ejecuta evaluación del sistema RAG |

**Ejemplo:**
```json
POST /api/evaluation/run
{
  "goldenSet": [
    {
      "question": "¿Qué es el Perceptrón?",
      "expectedSources": ["Redes_Neuronales_Artificiales.pdf"],
      "expectedKeywords": ["TLU", "Frank Rosenblatt", "función de activación"]
    }
  ],
  "topK": 3
}
```

**Métricas devueltas:**

| Métrica | Descripción |
|---|---|
| `precisionAtK` | Proporción de documentos recuperados que son relevantes |
| `recallAtK` | Proporción de documentos relevantes que fueron recuperados |
| `faithfulness` | Qué tan bien la respuesta refleja los keywords esperados |
| `latencyMs` | Tiempo de respuesta en milisegundos |

---

## 📊 Configuración del RAG

| Parámetro | Variable | Default | Descripción |
|---|---|---|---|
| Tamaño de chunk | `CHUNK_SIZE` | `300` | Caracteres por fragmento de documento |
| Overlap de chunk | `CHUNK_OVERLAP` | `50` | Solapamiento entre fragmentos |
| Top K | `TOP_K` | `3` | Documentos a recuperar por consulta |
| Score mínimo | — | `0.3` | Umbral de relevancia para documentos |

---

## 🔍 Cómo funciona el RAG híbrido

```
Pregunta del estudiante
        │
        ▼
  Embeddings (HuggingFace)
        │
   ┌────┴────┐
   ▼         ▼
Pinecone   Tavily
(PDFs      (web
del curso) académica)
   │         │
   └────┬────┘
        ▼
  Filtro score >= 0.3
        │
        ▼
  Prompt híbrido
  [DOC-N] + [WEB-N]
        │
        ▼
  Groq LLaMA 3.3 70B
        │
        ▼
  Respuesta con fuentes citadas
```

Los documentos académicos del curso tienen **prioridad** sobre los resultados web en caso de conflicto.



