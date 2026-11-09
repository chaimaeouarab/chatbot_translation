import { NextResponse } from "next/server.js"

const TRANSLATION_ENDPOINT = "http://127.0.0.1:8002/translate/v2"

export async function POST(request) {
  try {
    const data = await request.json()
    console.log(data)
    if (!data.text) return NextResponse.json({ error: "No text provided" }, { status: 400 })

    const response = await fetch(TRANSLATION_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: data.text, tgt_lang: data.tgt_lang }),
    })
    if (!response.ok) return NextResponse.json({ error: "Translation Service error" }, { status: 500 })

    return NextResponse.json(await response.json())
  } catch (error) {
    return NextResponse.json({ error: "Impossible de contacter le service de traduction" }, { status: 500 })
  }
}