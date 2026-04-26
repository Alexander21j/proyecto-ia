"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "¡Hola! 👋 Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simular respuesta del bot
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getRandomResponse(),
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
      setIsTyping(false)
    }, 1500)
  }

  const getRandomResponse = () => {
    const responses = [
      "¡Excelente pregunta! Déjame pensarlo... 🤔",
      "Entiendo lo que necesitas. Aquí está mi sugerencia...",
      "¡Claro que sí! Estoy aquí para ayudarte con eso.",
      "Esa es una consulta interesante. Permíteme elaborar...",
      "¡Por supuesto! Aquí tienes la información que buscas.",
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Asistente IA</h1>
            <p className="text-sm text-muted-foreground">Siempre disponible para ti</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <MessageBubble key={message.id} message={message} isLast={index === messages.length - 1} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 border-t border-border/50 bg-card/80 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl p-4">
          <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-lg shadow-primary/5 transition-shadow focus-within:shadow-xl focus-within:shadow-primary/10">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              rows={1}
              className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none"
              style={{
                height: "auto",
                minHeight: "44px",
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
                input.trim() && !isTyping
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 hover:shadow-xl hover:shadow-primary/40"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Presiona Enter para enviar • Shift + Enter para nueva línea
          </p>
        </form>
      </footer>
    </div>
  )
}

function MessageBubble({ message, isLast }: { message: Message; isLast: boolean }) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex items-end gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
        isLast && "animate-in fade-in slide-in-from-bottom-4 duration-500"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          isUser ? "bg-foreground text-background" : "bg-primary/10 text-primary"
        )}
      >
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "group relative max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-card text-card-foreground border border-border/50"
        )}
      >
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
        <span
          className={cn(
            "mt-1 block text-[11px] opacity-0 transition-opacity group-hover:opacity-100",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Bot className="h-5 w-5" />
      </div>
      <div className="rounded-2xl rounded-bl-md border border-border/50 bg-card px-4 py-3 shadow-sm">
        <div className="flex gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" />
        </div>
      </div>
    </div>
  )
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
