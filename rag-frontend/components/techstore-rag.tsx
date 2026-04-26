"use client"

import { useState, useRef, useEffect } from "react"
import {
  MessageSquare, FileText, BarChart3, Send, Bot, User,
  FileUp, Trash2, Play, ExternalLink, ChevronDown,
  Sparkles, Database, Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import axios from "axios"

const API = "http://localhost:3000/api"

type Tab = "chat" | "documentos" | "metricas"

interface Source {
  type: "DOC" | "WEB"
  name: string
  preview: string
  relevance: number
  url?: string
}

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  sources?: Source[]
  latencyMs?: number
  hasEvidence?: boolean
}

const GOLDEN_SET = [
  {
    question: "¿Qué es la Inteligencia Artificial?",
    expectedSources: ["Clase_1_IA.txt"],
    expectedKeywords: ["aprender", "patrones", "predicciones", "maquinas"]
  },
  {
    question: "¿Cuál es la diferencia entre IA, ML y Deep Learning?",
    expectedSources: ["Clase_1_IA.txt"],
    expectedKeywords: ["Machine Learning", "Deep Learning", "redes neuronales", "subcampo"]
  },
  {
    question: "¿Cuáles son los pasos del pipeline de Machine Learning?",
    expectedSources: ["Clase_1_IA.txt"],
    expectedKeywords: ["definicion", "entrenamiento", "evaluacion", "despliegue"]
  },
  {
    question: "¿Qué es el aprendizaje supervisado?",
    expectedSources: ["Intro_ML.txt"],
    expectedKeywords: ["supervisado", "entrada", "salida", "clasificacion", "regresion"]
  },
  {
    question: "¿Cuándo se debe utilizar Machine Learning?",
    expectedSources: ["Intro_ML.txt"],
    expectedKeywords: ["reglas", "heuristicas", "datos", "entornos"]
  },
  {
    question: "¿Para qué sirve la librería Numpy?",
    expectedSources: ["Librerias_ML.txt"],
    expectedKeywords: ["arrays", "matematicas", "algebra", "Python"]
  },
  {
    question: "¿Qué es Scikit-learn y para qué se usa?",
    expectedSources: ["Librerias_ML.txt"],
    expectedKeywords: ["aprendizaje", "supervisado", "modelos", "preprocesamiento"]
  },
  {
    question: "¿Qué es el Perceptrón y cuáles son sus limitaciones?",
    expectedSources: ["Redes_Neuronales.txt"],
    expectedKeywords: ["TLU", "threshold", "lineal", "XOR", "Rosenblatt"]
  },
  {
    question: "¿Por qué resurgen las Redes Neuronales Artificiales?",
    expectedSources: ["Redes_Neuronales.txt"],
    expectedKeywords: ["datos", "computacional", "algoritmos", "ImageNet"]
  },
  {
    question: "¿Qué tipos de redes neuronales existen?",
    expectedSources: ["Redes_Neuronales.txt"],
    expectedKeywords: ["convolucional", "recurrente", "multicapa", "fully connected"]
  }
]

export function TechStoreRAG() {
  const [activeTab, setActiveTab] = useState<Tab>("chat")

  const tabs = [
    { id: "chat" as Tab, label: "Chat", icon: MessageSquare, description: "Búsqueda semántica" },
    { id: "documentos" as Tab, label: "Documentos", icon: FileText, description: "Cargar e indexar" },
    { id: "metricas" as Tab, label: "Métricas", icon: BarChart3, description: "Evaluación" },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <Database className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Asistente IA Académico</h1>
              <p className="text-xs text-muted-foreground">Sistema de búsqueda semántica</p>
            </div>
          </div>

          <nav className="flex items-center rounded-2xl bg-muted/50 p-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300",
                    isActive ? "bg-card text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/70")} />
                  <span>{tab.label}</span>
                  {isActive && <span className="absolute -bottom-1 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-8">
          {activeTab === "chat" && <ChatTab />}
          {activeTab === "documentos" && <DocumentosTab />}
          {activeTab === "metricas" && <MetricasTab />}
        </div>
      </main>
    </div>
  )
}

function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [topK, setTopK] = useState([3])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isTyping) return

    const question = input.trim()
    setInput("")
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      content: question,
      role: "user",
      timestamp: new Date(),
    }])
    setIsTyping(true)

    try {
      const { data } = await axios.post(`${API}/rag/query`, { question, topK: topK[0] })
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        content: data.answer,
        role: "assistant",
        timestamp: new Date(),
        latencyMs: data.latencyMs,
        hasEvidence: data.hasEvidence,
        sources: data.sources.map((s: any) => ({
          type: s.type === "web" ? "WEB" : "DOC",
          name: s.source,
          preview: s.content,
          relevance: Math.round(s.score * 100),
          url: s.type === "web" ? s.source : undefined,
        })),
      }])
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        content: "Error conectando con el servidor. ¿Está corriendo NestJS en el puerto 3000?",
        role: "assistant",
        timestamp: new Date(),
      }])
    }
    setIsTyping(false)
  }

  const suggestions = [
     "¿Qué es Machine Learning?",
     "¿Cuál es la diferencia entre IA y Deep Learning?",
     "¿Para qué sirve Keras?",
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
        <span className="text-sm font-medium text-foreground">Top-K resultados:</span>
        <div className="flex-1">
          <Slider value={topK} onValueChange={setTopK} min={1} max={10} step={1} />
        </div>
        <span className="min-w-[2rem] text-right text-sm font-semibold text-primary">{topK[0]}</span>
      </div>

      <div className="min-h-[400px] rounded-2xl border border-border/50 bg-card/50 p-6">
        {messages.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Comienza una conversación</h3>
            <p className="mb-4 max-w-md text-sm text-muted-foreground">
              Escribe tu pregunta y el sistema buscará información relevante en los documentos indexados.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => setInput(s)}
                  className="rounded-full border border-border/50 bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className={cn(
            "flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-all",
            input.trim() && !isTyping
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Send className="h-4 w-4" />
          Enviar
        </button>
      </form>
    </div>
  )
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user"
  const [sourcesOpen, setSourcesOpen] = useState(true)

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
        isUser ? "bg-foreground text-background" : "bg-primary/10 text-primary")}>
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>
      <div className={cn("max-w-[80%] space-y-3", isUser && "text-right")}>
        <div className={cn("rounded-2xl px-4 py-3",
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-border/50 bg-card text-card-foreground")}>
          <p className="text-[15px] leading-relaxed">{message.content}</p>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="space-y-2">
            <button onClick={() => setSourcesOpen(!sourcesOpen)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
              <ChevronDown className={cn("h-3 w-3 transition-transform", sourcesOpen && "rotate-180")} />
              Fuentes utilizadas ({message.sources.length})
              {message.latencyMs && <span className="ml-2 text-muted-foreground/60">{message.latencyMs}ms</span>}
            </button>
            {sourcesOpen && (
              <div className="space-y-2">
                {message.sources.map((source, i) => (
                  <SourceCard key={i} source={source} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SourceCard({ source }: { source: Source }) {
  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 80) return "text-emerald-400 bg-emerald-500/20"
    if (relevance >= 60) return "text-amber-400 bg-amber-500/20"
    return "text-blue-400 bg-blue-500/20"
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/50 p-3 text-left">
      <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold",
        source.type === "DOC" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400")}>
        {source.type}
      </span>
      <div className="min-w-0 flex-1">
        {source.type === "WEB" ? (
          <a href={source.url ?? "#"} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <span className="truncate max-w-[200px]">{source.name}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : (
          <span className="text-sm font-medium text-foreground">{source.name}</span>
        )}
        {source.preview && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{source.preview}</p>}
      </div>
      <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold", getRelevanceColor(source.relevance))}>
        {source.relevance}%
      </span>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Bot className="h-5 w-5" />
      </div>
      <div className="rounded-2xl rounded-bl-md border border-border/50 bg-card px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" />
        </div>
      </div>
    </div>
  )
}

function DocumentosTab() {
  const [docName, setDocName] = useState("")
  const [docContent, setDocContent] = useState("")
  const [chunkSize, setChunkSize] = useState([300])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [activeMode, setActiveMode] = useState<"pdf" | "text">("pdf")

  const handleIngestText = async () => {
    if (!docName.trim() || !docContent.trim()) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await axios.post("http://localhost:3000/api/ingestion/text", {
        content: docContent, source: docName, chunkSize: chunkSize[0],
      })
      setResult(res.data)
      setDocName("")
      setDocContent("")
    } catch {
      setError("Error al indexar. ¿Está corriendo el servidor?")
    }
    setLoading(false)
  }

  const handleIngestPdf = async () => {
    if (!pdfFile) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const formData = new FormData()
      formData.append("file", pdfFile)
      const res = await axios.post(
        `http://localhost:3000/api/ingestion/pdf?chunkSize=${chunkSize[0]}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      setResult(res.data)
      setPdfFile(null)
    } catch {
      setError("Error al indexar el PDF. ¿Está corriendo el servidor?")
    }
    setLoading(false)
  }

  const handleClear = async () => {
    if (!confirm("¿Seguro que quieres borrar todos los documentos del índice?")) return
    try {
      await axios.delete("http://localhost:3000/api/ingestion/clear")
      setResult({ message: "Índice limpiado correctamente" })
    } catch {
      setError("Error al limpiar el índice.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Cargar documento</h2>
            <p className="text-sm text-muted-foreground">Indexa PDFs o texto en el sistema RAG</p>
          </div>
        </div>

        {/* Toggle PDF / Texto */}
        <div className="mb-6 flex gap-2 rounded-xl bg-muted/50 p-1">
          <button
            onClick={() => setActiveMode("pdf")}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
              activeMode === "pdf" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            Subir PDF
          </button>
          <button
            onClick={() => setActiveMode("text")}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
              activeMode === "text" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            Pegar texto
          </button>
        </div>

        {activeMode === "pdf" ? (
          <div className="space-y-4">
            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => document.getElementById("pdf-input")?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file?.type === "application/pdf") setPdfFile(file)
              }}
            >
              <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
              {pdfFile ? (
                <p className="text-sm font-medium text-primary">{pdfFile.name}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">Arrastra tu PDF aquí</p>
                  <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar</p>
                </>
              )}
              <input
                id="pdf-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Chunk size: <span className="text-primary">{chunkSize[0]}</span>
              </label>
              <Slider value={chunkSize} onValueChange={setChunkSize} min={100} max={1000} step={50} />
            </div>

            <button
              onClick={handleIngestPdf}
              disabled={loading || !pdfFile}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />Indexando PDF...</>
              ) : (
                <><FileUp className="h-4 w-4" />Indexar PDF</>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Nombre del documento</label>
              <input type="text" value={docName} onChange={(e) => setDocName(e.target.value)}
                placeholder="ej: clase3-regresion.txt"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Contenido</label>
              <textarea value={docContent} onChange={(e) => setDocContent(e.target.value)}
                placeholder="Pega aquí el contenido del documento..."
                rows={5}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Chunk size: <span className="text-primary">{chunkSize[0]}</span>
              </label>
              <Slider value={chunkSize} onValueChange={setChunkSize} min={100} max={1000} step={50} />
            </div>
            <button onClick={handleIngestText} disabled={loading || !docName || !docContent}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl disabled:opacity-50">
              {loading ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />Indexando...</>
              ) : (
                <><FileUp className="h-4 w-4" />Indexar texto</>
              )}
            </button>
          </div>
        )}

        <button onClick={handleClear}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 py-2.5 font-medium text-destructive transition-all hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
          Limpiar índice
        </button>

        {result && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <p className="text-sm text-emerald-400">
              {result.message ?? `✓ ${result.fileName} — ${result.chunksCreated} chunks creados`}
            </p>
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <Zap className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div>
          <h4 className="font-medium text-amber-300">Tip para el experimento de chunking</h4>
          <p className="mt-1 text-sm text-amber-400/80">
            Cambia el chunk size entre 300 y 600, limpia el índice y re-indexa los mismos documentos para comparar resultados en Métricas.
          </p>
        </div>
      </div>
    </div>
  )
}

function MetricasTab() {
  const [topK, setTopK] = useState([3])
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleEvaluate = async () => {
    setIsEvaluating(true)
    setResults(null)
    try {
      const { data } = await axios.post(`${API}/evaluation/run`, {
        goldenSet: GOLDEN_SET, topK: topK[0],
      })
      setResults(data)
    } catch {
      alert("Error al evaluar. ¿Está corriendo el servidor y hay documentos indexados?")
    }
    setIsEvaluating(false)
  }

  const pct = (n: number) => `${(n * 100).toFixed(1)}%`

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Evaluación con golden set</h2>
            <p className="text-sm text-muted-foreground">
              Evalúa el sistema con 8 preguntas predefinidas y calcula Precision@k, Recall@k y Faithfulness.
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">Top-K:</span>
          <div className="flex-1">
            <Slider value={topK} onValueChange={setTopK} min={1} max={10} step={1} />
          </div>
          <span className="min-w-[2rem] text-right text-sm font-semibold text-primary">{topK[0]}</span>
        </div>

        <button onClick={handleEvaluate} disabled={isEvaluating}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl disabled:opacity-70">
          {isEvaluating ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />Evaluando (puede tardar 1-2 min)...</>
          ) : (
            <><Play className="h-4 w-4" />Ejecutar evaluación</>
          )}
        </button>
      </div>

      {results ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Precision@k", value: pct(results.avgPrecisionAtK) },
              { label: "Recall@k", value: pct(results.avgRecallAtK) },
              { label: "Faithfulness", value: pct(results.avgFaithfulness) },
              { label: "Latencia avg", value: `${Math.round(results.avgLatencyMs)}ms` },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl border border-border/50 bg-card p-4 text-center shadow-sm">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="mt-1 text-2xl font-semibold text-primary">{m.value}</p>
                <p className="text-xs text-muted-foreground">topK={topK[0]}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
            <div className="border-b border-border/50 px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Resultados por pregunta</h3>
            </div>
            <div className="divide-y divide-border/50">
              {results.results.map((r: any, i: number) => (
                <div key={i} className="px-4 py-3">
                  <p className="text-sm font-medium text-foreground mb-2">{r.question}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">P@k: {pct(r.precisionAtK)}</span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">R@k: {pct(r.recallAtK)}</span>
                    <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">Faith: {pct(r.faithfulness)}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{r.latencyMs}ms</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Fuentes: {r.retrievedSources.join(", ") || "ninguna"}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30">
          <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Los resultados de la evaluación aparecerán aquí</p>
        </div>
      )}
    </div>
  )
}