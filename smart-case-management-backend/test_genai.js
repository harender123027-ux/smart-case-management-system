require('dotenv').config();
(async () => {
try {
  const { GoogleGenAI } = require('@google/genai');
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log('Listing 1.5 models...');
  
  const models = await genAI.models.list();
  const names = models.pageInternal.filter(m => m.name.includes('1.5')).map(m => m.name);
  console.log('1.5 Models:', JSON.stringify(names, null, 2));
  
} catch (e) {
  console.log('Failed:', e.message);
}
})();
