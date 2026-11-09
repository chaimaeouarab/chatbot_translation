import { NextResponse } from "next/server.js"

const LLM_STREAMING_ENDPOINT = "http://127.0.0.1:8001/streaming-text-generation"

async function streamFromLlm(prompt) {
  const llmResponse = await fetch(LLM_STREAMING_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })
  if (!llmResponse.ok) throw new Error("Text Generation Service error")

  const reader = llmResponse.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          controller.enqueue(encoder.encode(decoder.decode(value, { stream: true })))
        }
      } catch (error) {
        controller.error(error)
      } finally {
        controller.close()
      }
    },
  })
}

export async function POST(request) {
  try {
    const data = await request.json()
    console.log(data)
    if (!data.prompt) return NextResponse.json({ error: "No prompt provided" }, { status: 400 })

    const stream = await streamFromLlm(data.prompt)
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    })
  } catch (error) {
    return NextResponse.json({ error: "Impossible de contacter Flask" }, { status: 500 })
  }
}