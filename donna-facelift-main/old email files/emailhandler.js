// emailHandler.js
import { handleMessage } from './donnaBrain.js';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());

/**
 * POST /email-inbound
 * Expected JSON:
 * {
 *   "from": "lead@example.com",
 *   "subject": "Request for pricing",
 *   "body": "Hey, can you tell me what your services cost?",
 *   "thread": [ { from: "bot", content: "..." }, { from: "lead", content: "..." } ]
 * }
 */
app.post('/email-inbound', async (req, res) => {
  try {
    const { from, body, thread = [] } = req.body;

    // Combine thread into a single pseudo-conversation (optional)
    const combinedThread = thread.map(m =>
      `${m.from === 'bot' ? 'Donna:' : 'Lead:'} ${m.content}`
    ).join('\n') + `\nLead: ${body}`;

    const reply = await handleMessage(combinedThread, from, "marketing");

    // Respond with Donna's reply
    res.json({ success: true, reply });
  } catch (err) {
    console.error("❌ Error in /email-inbound", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`📬 Email handler running on http://localhost:${PORT}`);
});
