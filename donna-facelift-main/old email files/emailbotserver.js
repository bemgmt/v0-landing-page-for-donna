// emailBotServer.js
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { handleMessage } from './donnaBrain.js';
dotenv.config();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const THREAD_DIR = './conversations';
await fs.mkdir(THREAD_DIR, { recursive: true });

// --- LEAD SCORING --- //
function scoreLead(message) {
  const lower = message.toLowerCase();
  let score = 0;
  if (lower.includes("quote") || lower.includes("pricing") || lower.includes("estimate")) score += 3;
  if (lower.includes("timeline") || lower.includes("budget") || lower.includes("soon")) score += 2;
  if (message.length > 200) score += 1;
  return score;
}

// --- LOAD + SAVE THREADS --- //
async function loadThread(email) {
  const file = path.join(THREAD_DIR, `${email}.json`);
  try {
    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveThread(email, thread) {
  const file = path.join(THREAD_DIR, `${email}.json`);
  await fs.writeFile(file, JSON.stringify(thread, null, 2), 'utf-8');
}

// --- EMAIL SENDER --- //
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

async function sendReply(to, subject, body) {
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject: `Re: ${subject}`,
    text: body,
  });
}

// --- EMAIL ENTRY POINT --- //
app.post('/email-inbound', async (req, res) => {
  try {
    const { from, subject, body } = req.body;
    if (!from || !subject || !body) return res.status(400).json({ error: 'Missing fields' });

    const thread = await loadThread(from);
    thread.push({ from: 'lead', content: body });

    const leadScore = scoreLead(body);
    const combinedThread = thread.map(m => `${m.from === 'bot' ? 'Donna:' : 'Lead:'} ${m.content}`).join('\n');

    const reply = await handleMessage(combinedThread, from, 'marketing');

    thread.push({ from: 'bot', content: reply });
    await saveThread(from, thread);
    await sendReply(from, subject, reply);

    res.json({ success: true, reply, leadScore });
  } catch (err) {
    console.error('❌ Email bot error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`📬 Donna EmailBot running on http://localhost:${PORT}`);
});
