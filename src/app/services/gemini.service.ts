import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface TicketData {
  concepto: string;
  monto: number | null;
  fecha: string;        // YYYY-MM-DD
  categoria: string;    // comida | transporte | servicios | entretenimiento | otros
  metodoPago: string;   // efectivo | tarjeta | transferencia
  notas: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  // Usar gemini-2.5-flash (soporta visión/imágenes, cuota separada por modelo)
  private readonly apiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${environment.geminiApiKey}`;

  private readonly MAX_RETRIES = 3;

  async analizarTicket(base64Image: string): Promise<TicketData> {
    const hoy = new Date().toISOString().split('T')[0];

    const prompt = `Eres un asistente que analiza fotografías de tickets o recibos de compra.
Extrae la siguiente información del ticket y devuelve ÚNICAMENTE un JSON válido sin markdown, sin bloques de código, sin explicaciones.

Campos a extraer:
- concepto: nombre del establecimiento o descripción del gasto (string)
- monto: monto total pagado como número decimal (number o null si no se ve)
- fecha: fecha del ticket en formato YYYY-MM-DD (string, usa "${hoy}" si no se puede leer)
- categoria: una de estas opciones exactas: comida, transporte, servicios, entretenimiento, otros
- metodoPago: una de estas opciones exactas: efectivo, tarjeta, transferencia (usa "efectivo" si no se especifica)
- notas: cualquier dato adicional relevante del ticket como productos comprados (string, puede estar vacío)

Ejemplo de respuesta válida:
{"concepto":"Supermercado Walmart","monto":45.50,"fecha":"2024-01-15","categoria":"comida","metodoPago":"tarjeta","notas":"Compras de despensa"}

Si la imagen no es un ticket o no puedes leer nada, devuelve:
{"concepto":"","monto":null,"fecha":"${hoy}","categoria":"otros","metodoPago":"efectivo","notas":""}`;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingBudget: 1024
        }
      }
    };

    // Intentar con reintentos automáticos ante errores 429
    const response = await this.fetchWithRetry(this.apiUrl, body);

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const result = await response.json();

    // Extraer el texto de la respuesta de Gemini
    // gemini-2.5-flash es un modelo "thinking" que puede devolver partes de pensamiento
    // antes del texto real. Buscamos la última parte que no sea pensamiento.
    const parts = result?.candidates?.[0]?.content?.parts ?? [];
    const textPart = parts.filter((p: any) => !p.thought).pop();
    const rawText: string = textPart?.text ?? '';

    // Intentar parsear el JSON que devuelve Gemini
    try {
      // Limpiar posibles bloques de código markdown
      const cleaned = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();

      const parsed: TicketData = JSON.parse(cleaned);
      return {
        concepto: parsed.concepto ?? '',
        monto: typeof parsed.monto === 'number' ? parsed.monto : null,
        fecha: parsed.fecha ?? hoy,
        categoria: parsed.categoria ?? 'otros',
        metodoPago: parsed.metodoPago ?? 'efectivo',
        notas: parsed.notas ?? ''
      };
    } catch (parseErr) {
      console.error('Error parseando respuesta de Gemini:', rawText, parseErr);
      return {
        concepto: '',
        monto: null,
        fecha: hoy,
        categoria: 'otros',
        metodoPago: 'efectivo',
        notas: ''
      };
    }
  }

  /**
   * Realiza un fetch con reintentos automáticos ante errores 429 (rate limit).
   * Espera el tiempo sugerido por la API o usa backoff exponencial.
   */
  private async fetchWithRetry(url: string, body: any): Promise<Response> {
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.status !== 429) {
        return response;
      }

      // Extraer retryDelay de la respuesta si está disponible
      const errBody = await response.clone().json().catch(() => null);
      let waitSeconds = Math.pow(2, attempt + 1) * 15; // backoff: 30s, 60s, 120s

      if (errBody?.error?.details) {
        const retryInfo = errBody.error.details.find(
          (d: any) => d['@type']?.includes('RetryInfo')
        );
        if (retryInfo?.retryDelay) {
          const parsed = parseInt(retryInfo.retryDelay, 10);
          if (!isNaN(parsed) && parsed > 0) {
            waitSeconds = parsed + 2; // añadir 2s de margen
          }
        }
      }

      console.warn(
        `Gemini API 429 - Reintento ${attempt + 1}/${this.MAX_RETRIES} en ${waitSeconds}s...`
      );

      await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
    }

    // Último intento sin manejar 429
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }
}
