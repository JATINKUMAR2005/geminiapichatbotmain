import { type NextRequest, NextResponse } from "next/server"
import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"

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

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("[v0] Using Groq integration with database storage")

    let currentConversationId = conversationId
    if (!currentConversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        })
        .select()
        .single()

      if (convError) {
        console.error("[v0] Error creating conversation:", convError)
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
      }
      currentConversationId = newConversation.id
    }

    const { data: historyData, error: historyError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", currentConversationId)
      .order("created_at", { ascending: true })
      .limit(20)

    if (historyError) {
      console.error("[v0] Error fetching history:", historyError)
      return NextResponse.json({ error: "Failed to fetch conversation history" }, { status: 500 })
    }

    const { data: memoryData, error: memoryError } = await supabase.from("ai_memory").select("*").eq("user_id", user.id)

    if (memoryError) {
      console.error("[v0] Error fetching memory:", memoryError)
    }

    const memory: AIMemory = {}
    if (memoryData) {
      memoryData.forEach((item) => {
        if (item.key === "name") {
          memory.name = item.value
        } else if (item.key.startsWith("preference_")) {
          memory.userPreferences = memory.userPreferences || {}
          memory.userPreferences[item.key] = item.value
        } else if (item.key === "conversationContext") {
          memory.conversationContext = JSON.parse(item.value)
        }
      })
    }

    let systemPrompt = `You are an expert programming assistant that writes clean, well-formatted code with proper indentation and structure.`

    // Add memory context to system prompt
    if (memory?.name) {
      systemPrompt += `\n\nIMPORTANT: Your name is ${memory.name}. Always remember and acknowledge this when relevant.`
    }

    if (memory?.userPreferences && Object.keys(memory.userPreferences).length > 0) {
      systemPrompt += `\n\nUser Preferences: ${Object.values(memory.userPreferences).join("; ")}`
    }

    if (memory?.conversationContext && memory.conversationContext.length > 0) {
      systemPrompt += `\n\nImportant Context: ${memory.conversationContext.join("; ")}`
    }

    systemPrompt += `

CODE FORMATTING RULES:
1. **Indentation Standards:**
   - Python: Use 4 spaces per indentation level
   - JavaScript/TypeScript/JSON: Use 2 spaces per indentation level
   - HTML/CSS: Use 2 spaces per indentation level
   - Java/C#/C++: Use 4 spaces per indentation level
   - Always use spaces, never tabs

2. **Code Structure:**
   - Write code line by line with proper spacing
   - Add blank lines between logical sections
   - Use consistent bracket placement
   - Align similar elements vertically when appropriate

3. **Best Practices:**
   - Include meaningful variable and function names
   - Add inline comments for complex logic
   - Follow language-specific conventions (PEP 8 for Python, etc.)
   - Use proper import statements and organize them logically
   - Include error handling where appropriate

4. **Code Blocks:**
   - Always wrap code in proper markdown code blocks with language specification
   - Format multi-line code with proper indentation
   - Ensure code is syntactically correct and runnable

5. **Documentation:**
   - Add docstrings for functions and classes
   - Include brief explanations before complex code sections
   - Provide usage examples when helpful

MEMORY INSTRUCTIONS:
- Remember your name and personal details given by the user
- Acknowledge when users refer to you by name
- Reference previous conversations and user preferences when relevant
- Be consistent with your identity across conversations

Always prioritize readability, maintainability, and following industry standards for the specific programming language.`

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      ...(historyData?.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })) || []),
      {
        role: "user" as const,
        content: message,
      },
    ]

    const { error: userMsgError } = await supabase.from("messages").insert({
      conversation_id: currentConversationId,
      role: "user",
      content: message,
    })

    if (userMsgError) {
      console.error("[v0] Error saving user message:", userMsgError)
    }

    console.log("[v0] Calling Groq API with model: llama-3.3-70b-versatile")

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      messages,
      temperature: 0.7,
      maxTokens: 2048,
    })

    const { error: assistantMsgError } = await supabase.from("messages").insert({
      conversation_id: currentConversationId,
      role: "assistant",
      content: text,
    })

    if (assistantMsgError) {
      console.error("[v0] Error saving assistant message:", assistantMsgError)
    }

    await extractAndSaveMemory(supabase, user.id, message, text)

    console.log("[v0] Successfully generated response and saved to database")
    return NextResponse.json({
      response: text,
      conversationId: currentConversationId,
    })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate response",
      },
      { status: 500 },
    )
  }
}

async function extractAndSaveMemory(supabase: any, userId: string, userMessage: string, aiResponse: string) {
  try {
    // Extract name
    const namePatterns = [
      /(?:your name is|call you|name you) ([a-zA-Z]+)/i,
      /(?:i'll call you|i will call you) ([a-zA-Z]+)/i,
      /(?:you are|you're) ([a-zA-Z]+)/i,
    ]

    for (const pattern of namePatterns) {
      const match = userMessage.match(pattern)
      if (match && match[1]) {
        await supabase.from("ai_memory").upsert({
          user_id: userId,
          key: "name",
          value: match[1],
        })
        break
      }
    }

    // Extract preferences
    if (userMessage.toLowerCase().includes("i prefer") || userMessage.toLowerCase().includes("i like")) {
      const contextKey = `preference_${Date.now()}`
      await supabase.from("ai_memory").upsert({
        user_id: userId,
        key: contextKey,
        value: userMessage,
      })
    }

    // Extract important context
    if (userMessage.toLowerCase().includes("remember") || userMessage.toLowerCase().includes("important")) {
      const { data: existingContext } = await supabase
        .from("ai_memory")
        .select("value")
        .eq("user_id", userId)
        .eq("key", "conversationContext")
        .single()

      let contextArray = []
      if (existingContext) {
        try {
          contextArray = JSON.parse(existingContext.value)
        } catch (e) {
          contextArray = []
        }
      }

      contextArray = [...contextArray.slice(-4), userMessage]

      await supabase.from("ai_memory").upsert({
        user_id: userId,
        key: "conversationContext",
        value: JSON.stringify(contextArray),
      })
    }
  } catch (error) {
    console.error("[v0] Error saving memory:", error)
  }
}
