"use client"

import { useState, useRef, useEffect } from "react"
import { Box, Paper, TextField, Button, Typography, Chip, Select, MenuItem, CircularProgress, Tooltip } from "@mui/material"

const LANGUES = {
  ary_Arab: "Darija",
  arb_Arab: "Arabe",
  fra_Latn: "Français",
  eng_Latn: "Anglais",
  spa_Latn: "Espagnol",
  deu_Latn: "Allemand",
  ita_Latn: "Italien",
  por_Latn: "Portugais",
  tur_Latn: "Turc",
}

const EXEMPLES = [
  "Je veux renouveler mon passeport",
  "Where is the nearest hospital?",
  "بغيت نمشي للمدينة",
]

// couleurs du thème
const C = {
  fond: "#0f1115",
  carte: "#171a21",
  bord: "#262b36",
  bulleBot: "#1f2430",
  accent: "#4f8cff",
  texte: "#e8eaf0",
  discret: "#8b93a7",
}

export default function Page() {
  let [message, setMessage] = useState("")
  let [cible, setCible] = useState("ary_Arab")
  let [messages, setMessages] = useState([])
  let [loading, setLoading] = useState(false)
  let [copie, setCopie] = useState(null)
  const bas = useRef(null)

  // descend automatiquement au dernier message
  useEffect(() => {
    bas.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const send = async function (texteChoisi) {
    let texte = (texteChoisi ?? message).trim()
    if (texte === "" || loading) return

    setMessage("")
    setLoading(true)
    setMessages((prev) => [...prev, { role: "user", text: texte }])

    try {
      let response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: texte, tgt_lang: cible }),
      })
      let data = await response.json()

      if (response.ok) {
        setMessages((prev) => [...prev, {
          role: "bot",
          text: data.translation,
          de: LANGUES[data.detected_lang] || data.detected_lang,
          vers: LANGUES[data.tgt_lang] || data.tgt_lang,
        }])
      } else {
        setMessages((prev) => [...prev, { role: "bot", text: "Erreur : " + data.error, erreur: true }])
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", text: "Le service de traduction ne répond pas.", erreur: true }])
    }
    setLoading(false)
  }

  const copier = function (texte, i) {
    navigator.clipboard.writeText(texte)
    setCopie(i)
    setTimeout(() => setCopie(null), 1500)
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: C.fond, display: "flex", justifyContent: "center", alignItems: "center", p: 2 }}>
      <Paper
        elevation={0}
        sx={{
          width: "100%", maxWidth: 720, height: "min(760px, calc(100vh - 32px))",
          display: "flex", flexDirection: "column",
          bgcolor: C.carte, border: `1px solid ${C.bord}`, borderRadius: 4, overflow: "hidden",
        }}
      >
        {/* En-tête */}
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${C.bord}` }}>
          <Typography sx={{ color: C.texte, fontWeight: 700, fontSize: 20 }}>Traducteur</Typography>
          <Typography sx={{ color: C.discret, fontSize: 13.5, mt: 0.5 }}>
            Écrivez dans n'importe quelle langue : elle est détectée automatiquement.
          </Typography>
        </Box>

        {/* Conversation */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          {messages.length === 0 && (
            <Box sx={{ m: "auto", textAlign: "center", maxWidth: 420 }}>
              <Typography sx={{ color: C.texte, fontSize: 18, fontWeight: 600, mb: 1 }}>
                Que voulez-vous traduire ?
              </Typography>
              <Typography sx={{ color: C.discret, fontSize: 14, mb: 2.5 }}>
                Essayez un exemple :
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {EXEMPLES.map((ex) => (
                  <Box
                    key={ex}
                    dir="auto"
                    onClick={() => send(ex)}
                    sx={{
                      px: 2, py: 1.25, borderRadius: 2.5, cursor: "pointer", fontSize: 14,
                      color: C.texte, border: `1px solid ${C.bord}`,
                      "&:hover": { borderColor: C.accent, bgcolor: "rgba(79,140,255,0.06)" },
                    }}
                  >
                    {ex}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {messages.map((m, i) => (
            <Box key={i} sx={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "78%" }}>
              {m.role === "bot" && m.de && (
                <Chip
                  label={`${m.de}  →  ${m.vers}`}
                  size="small"
                  sx={{ mb: 0.75, bgcolor: "rgba(79,140,255,0.12)", color: C.accent, fontSize: 11.5, fontWeight: 600 }}
                />
              )}

              <Box
                dir="auto"
                sx={{
                  px: 2, py: 1.5, fontSize: 15.5, lineHeight: 1.6, whiteSpace: "pre-wrap",
                  borderRadius: 3,
                  borderBottomRightRadius: m.role === "user" ? 6 : 12,
                  borderBottomLeftRadius: m.role === "user" ? 12 : 6,
                  bgcolor: m.role === "user" ? C.accent : C.bulleBot,
                  color: m.erreur ? "#ff8a8a" : m.role === "user" ? "#fff" : C.texte,
                  border: m.role === "user" ? "none" : `1px solid ${C.bord}`,
                }}
              >
                {m.text}
              </Box>

              {m.role === "bot" && !m.erreur && (
                <Tooltip title={copie === i ? "Copié !" : "Copier"}>
                  <Button
                    size="small"
                    onClick={() => copier(m.text, i)}
                    sx={{ mt: 0.5, minWidth: 0, px: 1, color: C.discret, textTransform: "none", fontSize: 12 }}
                  >
                    {copie === i ? "✓ Copié" : "Copier"}
                  </Button>
                </Tooltip>
              )}
            </Box>
          ))}

          {loading && (
            <Box sx={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 1.25, color: C.discret, fontSize: 14 }}>
              <CircularProgress size={16} sx={{ color: C.accent }} /> Traduction en cours…
            </Box>
          )}
          <div ref={bas} />
        </Box>

                {/* Zone de saisie */}
        <Box sx={{ p: 2, borderTop: `1px solid ${C.bord}`, display: "flex", gap: 1.25, alignItems: "center" }}>
          <TextField
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send() }}
            placeholder="Écrivez votre texte…"
            fullWidth
            size="small"
            slotProps={{ htmlInput: { dir: "auto" } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: C.fond, color: C.texte, borderRadius: 3,
                "& fieldset": { borderColor: C.bord },
                "&:hover fieldset": { borderColor: "#3a4152" },
                "&.Mui-focused fieldset": { borderColor: C.accent },
              },
            }}
          />

          <Select
            value={cible}
            onChange={(e) => setCible(e.target.value)}
            size="small"
            sx={{
              minWidth: 130, bgcolor: C.fond, color: C.texte, borderRadius: 3,
              "& fieldset": { borderColor: C.bord },
              "& .MuiSvgIcon-root": { color: C.discret },
            }}
            MenuProps={{ slotProps: { paper: { sx: { bgcolor: C.carte, color: C.texte, border: `1px solid ${C.bord}` } } } }}
          >
            {Object.entries(LANGUES).map(([code, nom]) => (
              <MenuItem key={code} value={code}>{nom}</MenuItem>
            ))}
          </Select>

          <Button
            onClick={() => send()}
            variant="contained"
            disabled={loading || message.trim() === ""}
            disableElevation
            sx={{
              borderRadius: 3, px: 2.5, py: 1, textTransform: "none", fontWeight: 600,
              bgcolor: C.accent, "&:hover": { bgcolor: "#3d78ea" },
              "&.Mui-disabled": { bgcolor: "#2a3040", color: C.discret },
            }}
          >
            Traduire
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}