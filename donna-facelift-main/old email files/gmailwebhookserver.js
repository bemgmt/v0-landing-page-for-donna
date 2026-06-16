// gmailWebhookServer.js
import express from 'express';
import crypto from 'crypto';
import { exec } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Google sends a ping to verify your webhook
app.post('/gmail-webhook', (req, res) => {
  const channelId = req.headers['x-goog-channel-id'];
  const resourceState = req.headers['x-goog-resource-state'];
  const messageNumber = req.headers['x-goog-message-number'];

  console.log(`📨 Webhook ping received - Channel: ${channelId}, State: ${resourceState}, Msg #: ${messageNumber}`);

  // When new mail arrives, process inbox immediately
  if (resourceState === 'exists') {
    exec('php process_inbox.php', (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error running inbox processor: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`⚠️  STDERR: ${stderr}`);
      }
      console.log(`✅ Inbox processed: \n${stdout}`);
    });
  }

  res.status(200).send('OK');
});

const PORT = process.env.WEBHOOK_PORT || 5006;
app.listen(PORT, () => {
  console.log(`📡 Gmail Webhook server listening on http://localhost:${PORT}/gmail-webhook`);
});
