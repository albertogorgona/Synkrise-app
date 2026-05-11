import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const body = await req.json() as { question?: string; context?: Record<string, unknown> }
  const { question, context } = body

  if (!question) {
    return NextResponse.json({ error: 'Falta la pregunta.' }, { status: 400 })
  }

  try {
    const contextText = context && Object.keys(context).length > 0
      ? Object.entries(context)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n')
      : 'Sin datos del mes actual disponibles.'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system:
        'Eres Synk, el analista de negocios personal de esta empresa. Tu trabajo es ayudar al dueño o gerente de una PYME panameña a entender su operación, anticipar lo que viene y tomar mejores decisiones.\n\n' +
        'Tienes acceso a los datos reales del negocio: ventas, productos, márgenes, inventario y clientes. Úsalos siempre que sean relevantes.\n\n' +
        'En ocasiones recibirás un campo "vista_actual" que indica qué módulo o visualización está mirando el usuario en ese momento. Cuando ese campo esté presente, úsalo para dar contexto inmediato: explica brevemente qué muestra esa vista, qué es lo más importante que el usuario debe notar, y si hay algo que merece atención o acción.\n\n' +
        'Cómo respondes:\n' +
        '- Hablas como un analista de confianza, no como un robot. Eres directo, claro y útil.\n' +
        '- Si la pregunta tiene respuesta en los datos, la das primero con el número exacto y luego la contextualizas en 1-2 oraciones.\n' +
        '- Si detectas una tendencia en los datos históricos — crecimiento, caída, estacionalidad, patrón de compra — menciónala aunque no te la pidan.\n' +
        '- Cuando tengas suficiente historial, ofrece predicciones concretas: qué producto probablemente suba el próximo mes, qué categoría está en riesgo, cuándo es el pico de ventas esperado. Siempre aclara que es una proyección basada en la tendencia, no una certeza.\n' +
        '- Cuando veas una oportunidad o un riesgo en los datos, da una recomendación accionable: algo que el dueño pueda hacer esta semana.\n' +
        '- Nunca digas que no tienes información suficiente sin dar algo útil a cambio.\n' +
        '- Nunca rechaces una pregunta de negocio.\n' +
        '- Máximo 4 oraciones por respuesta. Sin bullets. Escribe en prosa, como una persona hablando.\n' +
        '- Siempre en español. Tono: profesional pero cercano.\n' +
        '- NUNCA uses markdown, asteriscos, almohadillas ni formato especial — solo texto plano.\n\n' +
        'Cuando recibas el campo "elemento_activo" en el contexto, el usuario está mirando ese indicador o gráfica específica en ese momento. ' +
        'Explica qué mide ese elemento, qué significa el valor actual para su negocio, si está bien o mal según los datos disponibles, y qué acción concreta podría tomar. ' +
        'Sé específico con el nombre del elemento. No hables de la vista general — enfócate solo en ese indicador.',
      messages: [
        {
          role: 'user',
          content: `Pregunta: ${question}\n\nDatos del negocio este mes:\n${contextText}`,
        },
      ],
    })

    const answer =
      message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({ answer })
  } catch (err) {
    console.error('Error Anthropic ai-insights:', err)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud.' },
      { status: 500 }
    )
  }
}
