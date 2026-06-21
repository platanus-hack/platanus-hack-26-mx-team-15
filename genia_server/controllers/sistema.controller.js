import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import ExcelJS from "exceljs";

// Lógica pura: recibe un Buffer, regresa { tablas, sql, explicacion }
async function procesarExcel(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
        throw new Error('Se requiere un buffer válido de archivo Excel.');
    }

    if (!process.env.GOOGLE_API_KEY) {
        throw new Error('GOOGLE_API_KEY no está definida en process.env (revisa el orden de carga de dotenv).');
    }

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

    let response;
    try {
        response = await model.invoke(prompt);
    } catch (err) {
        console.error('Error llamando al modelo de Gemini:', err);
        throw new Error(`Falló la llamada al modelo: ${err.message}`);
    }

    // response.content puede venir como string o como arreglo de bloques
    // según la versión del SDK / si el modelo usa "thinking"
    let contentText;
    if (typeof response.content === 'string') {
        contentText = response.content;
    } else if (Array.isArray(response.content)) {
        contentText = response.content
            .map(block => (typeof block === 'string' ? block : block.text || ''))
            .join('');
    } else {
        console.error('Forma inesperada de response.content:', JSON.stringify(response, null, 2));
        throw new Error('La respuesta del modelo no tiene el formato esperado.');
    }

    const raw = contentText.trim().replace(/^```json\s*|```$/g, '').trim();

    try {
        console.log("El JSON es: " + raw)
        return JSON.parse(raw);
    } catch (err) {
        throw new Error(`La respuesta del modelo no es un JSON válido: ${err.message}\nRespuesta cruda: ${raw}`);
    }
}

// Este es el controlador real, el que va en la ruta
export async function conversionExcel(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ ok: false, error: 'No se recibió ningún archivo Excel.' });
        }

        const resultado = await procesarExcel(req.file.buffer);
        return res.status(200).json({ ok: true, ...resultado });
    } catch (err) {
        console.error('Error en conversionExcel:', err);
        return res.status(500).json({ ok: false, error: err.message });
    }
}