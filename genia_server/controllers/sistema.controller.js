import { supabase } from "../config/supabaseClient.js";

const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const ExcelJS = require('exceljs');
require('dotenv').config();

async function conversionExcel(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
        throw new Error('Se esperaba un buffer de archivo Excel.');
    }

    // 1. Leer Excel directamente desde el buffer
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
        throw new Error('El archivo Excel no contiene hojas con datos.');
    }

    let data = "";
    worksheet.eachRow((row) => {
        data += row.values.join(",") + "\n";
    });

    // 3. Llamar al modelo
    const model = new ChatGoogleGenerativeAI({
        modelName: "gemini-2.5-flash",
        apiKey: process.env.GOOGLE_API_KEY,
    });

    const prompt = `Analiza estos datos de un archivo Excel:
${data}

Normalízalos a 3FN y genera el script SQL de MySQL.

Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin markdown, sin backticks), con esta estructura exacta:
{
  "tablas": [
    { "nombre": "string", "columnas": ["string"], "descripcion": "string" }
  ],
  "sql": "string con el script SQL completo",
  "explicacion": "string con un resumen breve de la normalización aplicada"
}`;

    const response = await model.invoke(prompt);

    // 4. Parsear JSON de la respuesta
    const raw = response.content.trim().replace(/^```json\s*|```$/g, '').trim();

    try {
        return JSON.parse(raw);
    } catch (err) {
        throw new Error(`La respuesta del modelo no es un JSON válido: ${err.message}\nRespuesta cruda: ${raw}`);
    }
}

module.exports = { conversionExcel };