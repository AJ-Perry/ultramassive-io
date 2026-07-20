const functions = require('@google-cloud/functions-framework');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');

// Restricts API access to your domain, but allows local testing
const cors = require('cors')({ origin: ['https://www.ultramassiveml.io', 'https://ultramassiveml.io', 'http://localhost:8000'] });

functions.http('ethelChat', (req, res) => {
  // 1. Serve the Frontend Web Page
  if (req.method === 'GET') {
    const indexPath = path.join(__dirname, 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
      if (err) {
        return res.status(500).send('Error loading frontend assets.');
      }
      res.status(200).set('Content-Type', 'text/html').send(html);
    });
    return;
  }

  // 2. Handle Chat API Traffic
  cors(req, res, async () => {
    // Handle preflight CORS requests
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST, GET');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '3600');
      return res.status(204).send('');
    }

    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const userMessage = req.body.message;
      const result = await model.generateContent(userMessage);
      const responseText = await result.response.text();

      res.status(200).json({ reply: responseText });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error processing request');
    }
  });
});