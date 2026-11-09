"use client"

import { Button, TextField } from "@mui/material"
import { useState } from "react"

export default function Page() {
  let [message, setMessage] = useState("")
  let [messages, setMessages] = useState([])
  let [loading, setLoading] = useState(false)

  const addToLastMessage = function (text) {
    setMessages((prev) => {
      let copy = [...prev]
      let last = copy[copy.length - 1]
      copy[copy.length - 1] = { ...last, text: last.text + text }
      return copy
    })
  }

  const send = async function () {
    if (message.trim() === "" || loading) return
    let question = message
    setMessage("")
    setLoading(true)
    setMessages((prev) => [...prev, { role: "user", text: question }, { role: "bot", text: "" }])

    try {
      let response = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: question }),
      })
      if (!response.ok) {
        addToLastMessage("Erreur : le serveur ne répond pas.")
      } else {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          addToLastMessage(decoder.decode(value, { stream: true }))
        }
      }
    } catch (error) {
      addToLastMessage("Erreur : impossible de contacter le serveur.")
    }
    setLoading(false)
  }

  return (
    <div style={{ background: "#121212", minHeight: "100vh", padding: "30px 10px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", fontFamily: "sans-serif" }}>
        <h2 style={{ background: "#1e1e1e", color: "#eee", padding: 15, margin: 0, border: "1px solid #333" }}>
          Chatbot Qwen
        </h2>
        <div style={{ background: "#181818", height: 400, overflowY: "auto", padding: 15, border: "1px solid #333", borderTop: "none" }}>
          {messages.map((m, i) => (
            <div key={i} dir="auto" style={{
              background: m.role === "user" ? "#3a3a3a" : "#262626", color: "#eee",
              marginLeft: m.role === "user" ? "auto" : 0, maxWidth: "70%",
              padding: 10, borderRadius: 8, marginBottom: 10, whiteSpace: "pre-wrap",
            }}>
              {m.text || "..."}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <TextField value={message} onChange={(e) => setMessage(e.target.value)} fullWidth size="small"
            sx={{ "& .MuiOutlinedInput-root": { background: "#1e1e1e", color: "#eee" }, "& fieldset": { borderColor: "#444" } }} />
          <Button onClick={send} variant="contained" disabled={loading} style={{ background: "#555", color: "white" }}>
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}