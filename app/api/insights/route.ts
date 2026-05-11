import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { summary } = await req.json() as { summary?: string }

  if (!summary) {
    return NextResponse.json({ error: 'No se recibieron datos.' }, { status: 400 })
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: `Eres un analista de negocios especialista en PYMEs panameñas.
Recibes un resumen de datos operacionales de un dashboard de negocio.
Responde SIEMPRE en español, en lenguaje simple y directo.
Sin tecnicismos. Sin jerga financiera compleja.
El usuario es un dueño de negocio, no un analista.

Formato de respuesta — EXACTAMENTE este JSON:
{
  "insights": [
    {
      "tipo": "positivo" | "alerta" | "oportunidad",
      "titulo": "Título corto (máx 6 palabras)",
      "que_pasa": "Una oración simple explicando qué está ocurriendo.",
      "por_que_importa": "Una oración explicando el impacto en el negocio.",
      "que_hacer": "Una acción concreta y específica que el dueño puede tomar hoy."
    }
  ]
}
Responde SOLO con el JSON. Sin texto adicional, sin markdown, sin explicaciones.`,
    messages: [{ role: 'user', content: summary }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const parsed = JSON.parse(text) as { insights: unknown[] }
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Error al procesar respuesta de IA.' }, { status: 500 })
  }
}
