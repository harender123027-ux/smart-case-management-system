const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Multer config for AI analysis (memory storage is fine for temporary analysis)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for analysis
});

let genAI;
try {
  const { GoogleGenAI } = require('@google/genai');
  genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} catch (e) {
  console.warn('Gemini AI not initialized:', e.message);
}

// POST /api/ai/search — Natural language case/complaint search
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { query, language = 'en' } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });

    // Fetch recent cases and complaints for context
    const cases = await pool.query('SELECT case_number, title, description, status, case_type FROM cases ORDER BY created_at DESC LIMIT 50');
    const complaints = await pool.query('SELECT complaint_number, complaint_type, description, status FROM complaints ORDER BY created_at DESC LIMIT 50');

    const context = `
Cases Database:
${cases.rows.map(c => `[${c.case_number}] ${c.title} - ${c.case_type} - ${c.status}: ${c.description?.slice(0, 100)}`).join('\n')}

Complaints Database:
${complaints.rows.map(c => `[${c.complaint_number}] ${c.complaint_type} - ${c.status}: ${c.description?.slice(0, 100)}`).join('\n')}
`;

    const prompt = language === 'hi'
      ? `आप एक पुलिस केस मैनेजमेंट AI असिस्टेंट हैं। नीचे दिए गए डेटाबेस में से प्रश्न का उत्तर दें:\n\nडेटाबेस:\n${context}\n\nप्रश्न: ${query}\n\nकृपया हिंदी में उत्तर दें।`
      : `You are a police case management AI assistant. Search the following database and answer the query:\n\nDatabase:\n${context}\n\nQuery: ${query}\n\nProvide relevant case/complaint numbers and a brief summary.`;

    if (!genAI) {
      return res.json({ result: 'AI search unavailable (no API key). Showing all results.', cases: cases.rows, complaints: complaints.rows });
    }

    const response = await genAI.models.generateContent({
      model: 'models/gemini-flash-latest',
      contents: prompt,
    });

    res.json({ result: response.text, query });
  } catch (err) {
    console.error('AI search error:', err);
    res.status(500).json({ error: 'AI search failed', details: err.message });
  }
});

// POST /api/ai/predictive — Predictive policing insights
router.post('/predictive', authenticateToken, async (req, res) => {
  try {
    const { language = 'en' } = req.body;

    const stats = await pool.query(`
      SELECT 
        case_type, COUNT(*) as count, 
        AVG(CASE WHEN status='closed' THEN 1 ELSE 0 END) as resolution_rate,
        location
      FROM cases 
      WHERE created_at > NOW() - INTERVAL '90 days'
      GROUP BY case_type, location
      ORDER BY count DESC LIMIT 20
    `);

    const recentComplaints = await pool.query(`
      SELECT complaint_type, location, COUNT(*) as count
      FROM complaints 
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY complaint_type, location
      ORDER BY count DESC LIMIT 10
    `);

    const data = {
      case_trends: stats.rows,
      recent_complaints: recentComplaints.rows,
    };

    if (!genAI) {
      return res.json({ insights: 'AI insights unavailable (no API key configured).', data });
    }

    const prompt = language === 'hi'
      ? `आप एक पुलिस डेटा विश्लेषण AI हैं। पिछले 90 दिनों के आंकड़ों के आधार पर भविष्यवाणी और सुझाव दें:\n\n${JSON.stringify(data, null, 2)}\n\nकृपया हिंदी में:\n1. प्रमुख रुझान बताएं\n2. हॉटस्पॉट क्षेत्र बताएं\n3. सुझाव दें`
      : `You are a predictive policing AI. Analyze the last 90 days of crime data and provide insights:\n\n${JSON.stringify(data, null, 2)}\n\nProvide:\n1. Key crime trends\n2. Hotspot areas\n3. Preventive recommendations\n4. Resource allocation suggestions`;

    const response = await genAI.models.generateContent({
      model: 'models/gemini-flash-latest',
      contents: prompt,
    });

    res.json({ insights: response.text, data });
  } catch (err) {
    console.error('Predictive AI error:', err);
    res.status(500).json({ error: 'Predictive analysis failed', details: err.message });
  }
});

// POST /api/ai/parse-complaint — Parse voice/text input into structured complaint
router.post('/parse-complaint', authenticateToken, async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;

    if (!genAI) {
      return res.json({ parsed: { description: text, complaint_type: 'Other', priority: 'medium' } });
    }

    const prompt = `Extract structured complaint details from this text and return JSON only:
Text: "${text}"
Return JSON: { "complainant_name": "", "complaint_type": "theft|assault|fraud|missing|accident|other", "description": "", "location": "", "priority": "low|medium|high|urgent" }`;

    const response = await genAI.models.generateContent({
      model: 'models/gemini-flash-latest',
      contents: prompt,
    });

    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { description: text };

    res.json({ parsed });
  } catch (err) {
    console.error('Parse complaint error:', err);
    res.status(500).json({ error: 'Parse failed', details: err.message });
  }
});

// POST /api/ai/transcribe — Transcribe base64 audio via Gemini
router.post('/transcribe', authenticateToken, async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/m4a', language = 'en' } = req.body;
    if (!audioBase64) return res.status(400).json({ error: 'audioBase64 required' });

    if (!genAI) {
      return res.status(503).json({ error: 'Gemini AI not configured. Add GEMINI_API_KEY to .env' });
    }

    const prompt = language === 'hi'
      ? 'इस ऑडियो को हिंदी में लिखें। केवल बोले गए शब्द लिखें, कोई अतिरिक्त टिप्पणी नहीं।'
      : 'Transcribe this audio exactly as spoken. Output only the transcribed text, no extra commentary.';

    const response = await genAI.models.generateContent({
      model: 'models/gemini-flash-latest',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: audioBase64 } },
          ],
        },
      ],
    });

    res.json({ transcript: response.text?.trim() || '' });
  } catch (err) {
    console.error('Transcribe error:', err);
    res.status(500).json({ error: 'Transcription failed', details: err.message });
  }
});

// POST /api/ai/analyze-pdf — Extract structured data from PDF
router.post('/analyze-pdf', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are supported for auto-fill' });
    }

    if (!genAI) {
      return res.status(503).json({ error: 'Gemini AI not configured.' });
    }

    const prompt = `
Extract structured complaint details from this PDF document. 
Identify the complainant's name, phone number, address, type of incident, a detailed description, and the location of the incident.
Return the data STRICTLY as a JSON object with these keys: 
complainant_name, complainant_phone, complainant_address, complaint_type (one of: theft, assault, fraud, missing, other), description, location, priority (one of: low, medium, high, urgent).
If any field is missing, use an empty string.
`;

    const result = await genAI.models.generateContent({
      model: 'models/gemini-flash-latest',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'application/pdf', data: req.file.buffer.toString('base64') } },
          ],
        },
      ],
    });

    const responseText = result.text;
    console.log('Gemini PDF Analysis raw response:', responseText);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('AI non-JSON response:', responseText);
      return res.status(500).json({ error: 'Failed to extract structured data from PDF' });
    }

    try {
      const parsedData = JSON.parse(jsonMatch[0]);
      console.log('Parsed PDF data:', parsedData);
      res.json({ parsed: parsedData });
    } catch (parseErr) {
      console.error('JSON Parse error on AI response:', parseErr);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (err) {
    console.error('PDF AI Analysis error:', err);
    res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
});

// POST /api/ai/analyze-legal-pdf — Analyze a case document to suggest applicable BNS/BNSS acts
router.post('/analyze-legal-pdf', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are supported.' });
    }

    if (!genAI) {
      return res.status(503).json({ error: 'Gemini AI not configured.' });
    }

    const prompt = `
You are a legal AI assistant for police officers in India. Read the attached FIR draft, complaint, or case document (PDF).
Identify the key events, offenses, or situations described.
Based on the events, suggest which specific sections of the BNS (Bharatiya Nyaya Sanhita) or BNSS (Bharatiya Nagarik Suraksha Sanhita) are likely applicable to this case.
Provide your answer clearly, listing the applicable sections along with a brief reason why they apply.
Limit the response to at most 3-4 key sections, keeping it highly relevant and concise for a police officer's quick reference. Do not output markdown codeblocks around the text, but you can use formatting.
`;

    const result = await genAI.models.generateContent({
      model: 'models/gemini-flash-latest',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'application/pdf', data: req.file.buffer.toString('base64') } },
          ],
        },
      ],
    });

    res.json({ analysis: result.text });
  } catch (err) {
    console.error('Legal AI Analysis error:', err);
    res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
});

module.exports = router;

