"use client"

import React from "react"
import type { ReactElement } from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Bot, User, X, Maximize2, Copy, Check, LogIn } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: string
}

interface AIMemory {
  name?: string
  userPreferences?: Record<string, any>
  personalInfo?: Record<string, any>
  conversationContext?: string[]
}

const MessageContent = React.memo(({ content }: { content: string }) => {
  const [copiedBlocks, setCopiedBlocks] = useState<Set<number>>(new Set())

  const copyToClipboard = useCallback(async (text: string, blockIndex: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedBlocks((prev) => new Set(prev).add(blockIndex))
      setTimeout(() => {
        setCopiedBlocks((prev) => {
          const newSet = new Set(prev)
          newSet.delete(blockIndex)
          return newSet
        })
      }, 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }, [])

  const parsedContent = useMemo(() => {
    const parts = content.split(/(```[\s\S]*?```|`[^`\n]+`)/g)
    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.split("\n")
        const language = lines[0].replace("```", "").trim() || "text"
        const code = lines.slice(1, -1).join("\n")

        return {
          type: "codeblock",
          content: code,
          language,
          index,
        }
      }

      if (part.startsWith("`") && part.endsWith("`") && !part.includes("\n")) {
        const code = part.slice(1, -1)
        return {
          type: "inline",
          content: code,
          index,
        }
      }

      return {
        type: "text",
        content: part,
        index,
      }
    })
  }, [content])

  return (
    <div className="space-y-2">
      {parsedContent.map((part) => {
        if (part.type === "codeblock") {
          return (
            <div key={part.index} className="relative group">
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-300 text-xs">
                  <span className="font-medium">{part.language}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                    onClick={() => copyToClipboard(part.content, part.index)}
                  >
                    {copiedBlocks.has(part.index) ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <pre className="p-4 overflow-x-auto text-sm">
                  <code className="text-gray-100 whitespace-pre">{part.content}</code>
                </pre>
              </div>
            </div>
          )
        }

        if (part.type === "inline") {
          return (
            <code key={part.index} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
              {part.content}
            </code>
          )
        }

        return (
          <div key={part.index} className="whitespace-pre-wrap leading-relaxed">
            {part.content}
          </div>
        )
      })}
    </div>
  )
})

MessageContent.displayName = "MessageContent"

const MessageBubble = React.memo(({ message }: { message: Message }) => {
  return (
    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} gap-2 sm:gap-3 lg:gap-4`}>
      {message.role === "assistant" && (
        <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-primary" />
        </div>
      )}

      <div
        className={`min-w-0 flex-1 max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%] xl:max-w-[65%] px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 rounded-lg ${
          message.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
        }`}
      >
        <div className="text-sm sm:text-base lg:text-lg">
          <MessageContent content={message.content} />
        </div>
        <span className="text-xs sm:text-sm opacity-70 mt-1 sm:mt-2 block">{message.timestamp}</span>
      </div>

      {message.role === "user" && (
        <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-accent" />
        </div>
      )}
    </div>
  )
})

MessageBubble.displayName = "MessageBubble"

export function ChatDemo(): ReactElement {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI assistant. Ask me anything!",
      role: "assistant",
      timestamp: "12:00",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()
  const [aiMemory, setAiMemory] = useState<AIMemory>({})
  const [user, setUser] = useState<any>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: memoryData } = await supabase.from("ai_memory").select("*").eq("user_id", user.id)

        if (memoryData) {
          const memory: AIMemory = {}
          memoryData.forEach((item) => {
            if (item.key === "name") {
              memory.name = item.value
            } else if (item.key.startsWith("preference_")) {
              memory.userPreferences = memory.userPreferences || {}
              memory.userPreferences[item.key] = item.value
            } else if (item.key === "conversationContext") {
              try {
                memory.conversationContext = JSON.parse(item.value)
              } catch (e) {
                memory.conversationContext = []
              }
            }
          })
          setAiMemory(memory)
        }
      }
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const savedMemory = localStorage.getItem("ai-memory")
    if (savedMemory) {
      try {
        setAiMemory(JSON.parse(savedMemory))
      } catch (error) {
        console.error("Failed to load AI memory:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("ai-memory", JSON.stringify(aiMemory))
  }, [aiMemory])

  const extractMemoryFromMessage = useCallback((userMessage: string, aiResponse: string) => {
    const namePatterns = [
      /(?:your name is|call you|name you) ([a-zA-Z]+)/i,
      /(?:i'll call you|i will call you) ([a-zA-Z]+)/i,
      /(?:you are|you're) ([a-zA-Z]+)/i,
    ]

    for (const pattern of namePatterns) {
      const match = userMessage.match(pattern)
      if (match && match[1]) {
        setAiMemory((prev) => ({
          ...prev,
          name: match[1],
        }))
        break
      }
    }

    if (userMessage.toLowerCase().includes("i prefer") || userMessage.toLowerCase().includes("i like")) {
      const contextKey = `preference_${Date.now()}`
      setAiMemory((prev) => ({
        ...prev,
        userPreferences: {
          ...prev.userPreferences,
          [contextKey]: userMessage,
        },
      }))
    }

    if (userMessage.toLowerCase().includes("remember") || userMessage.toLowerCase().includes("important")) {
      setAiMemory((prev) => ({
        ...prev,
        conversationContext: [...(prev.conversationContext || []).slice(-4), userMessage],
      }))
    }
  }, [])

  useEffect(() => {
    const handleOpenFullScreen = () => {
      setIsFullScreen(true)
    }

    window.addEventListener("openFullScreenChat", handleOpenFullScreen)
    return () => window.removeEventListener("openFullScreenChat", handleOpenFullScreen)
  }, [])

  useEffect(() => {
    if (isFullScreen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isFullScreen])

  const scrollToBottom = useCallback(() => {
    if (shouldAutoScroll && chatContainerRef.current) {
      const container = chatContainerRef.current
      container.scrollTop = container.scrollHeight
    }
  }, [shouldAutoScroll])

  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
        const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100
        setShouldAutoScroll(isAtBottom)
      }
    }, 100)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(scrollToBottom, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [messages.length, isLoading, scrollToBottom])

  const getCurrentTime = () => {
    const now = new Date()
    return `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    if (!user) {
      router.push("/auth/login")
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: getCurrentTime(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input.trim()
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          conversationId: conversationId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: getCurrentTime(),
      }

      setMessages((prev) => [...prev, botMessage])
      extractMemoryFromMessage(currentInput, data.response)
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again.",
        role: "assistant",
        timestamp: getCurrentTime(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const renderedMessages = useMemo(() => {
    return messages.map((message) => <MessageBubble key={message.id} message={message} />)
  }, [messages])

  if (!user) {
    return (
      <section id="chat-demo" className="py-8 sm:py-12 lg:py-16 xl:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8 lg:mb-12 xl:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-balance mb-3 sm:mb-4 lg:mb-6">
              Try It Yourself
            </h2>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground text-pretty max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto">
              Sign in to experience the power of our AI assistant with persistent memory.
            </p>
          </div>

          <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl mx-auto">
            <Card className="h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px] xl:h-[600px] flex flex-col">
              <CardHeader className="bg-primary text-primary-foreground shrink-0">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                      <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-sm sm:text-base lg:text-lg">AI Assistant Demo</span>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <LogIn className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Sign in to start chatting</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create an account to save your conversations and AI memory
                    </p>
                    <div className="space-x-2">
                      <Button onClick={() => router.push("/auth/login")}>Sign In</Button>
                      <Button variant="outline" onClick={() => router.push("/auth/sign-up")}>
                        Sign Up
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    )
  }

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex-1 flex flex-col w-full h-full">
          <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold">{aiMemory.name || "AI Assistant"}</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullScreen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 sm:h-10 sm:w-10"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6 min-h-0"
            style={{ scrollBehavior: "auto" }}
          >
            <div className="max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
              {renderedMessages}

              {isLoading && (
                <div className="flex justify-start gap-2 sm:gap-3 lg:gap-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-primary" />
                  </div>
                  <div className="bg-muted px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 sm:p-4 lg:p-6 border-t bg-background shrink-0">
            <div className="max-w-none lg:max-w-6xl xl:max-w-7xl mx-auto">
              <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3 lg:gap-4">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 text-sm sm:text-base lg:text-lg h-10 sm:h-12 lg:h-14"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 shrink-0"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section id="chat-demo" className="py-8 sm:py-12 lg:py-16 xl:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12 xl:mb-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-balance mb-3 sm:mb-4 lg:mb-6">
            Try It Yourself
          </h2>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground text-pretty max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto">
            Experience the power of our AI assistant. Start a conversation and see how it can help you.
          </p>
        </div>

        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl mx-auto">
          <Card
            className="h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px] xl:h-[600px] flex flex-col cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            onClick={() => setIsFullScreen(true)}
          >
            <CardHeader className="bg-primary text-primary-foreground shrink-0">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg">
                    {aiMemory.name ? `${aiMemory.name} Demo` : "AI Assistant Demo"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/20 h-6 w-6 sm:h-8 sm:w-8"
                >
                  <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 space-y-2 sm:space-y-3 lg:space-y-4 min-h-0">
              {renderedMessages.slice(0, 3)}

              <div className="text-center text-xs sm:text-sm lg:text-base text-muted-foreground py-2 sm:py-4 lg:py-6">
                Click anywhere to start chatting in full screen
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
