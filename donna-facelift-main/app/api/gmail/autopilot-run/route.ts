import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { google, gmail_v1 } from 'googleapis'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function getAccessToken(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { token } = await oauth2Client.getAccessToken();
  if (!token) throw new Error('Failed to retrieve access token');
  return token;
}

function getEmailContent(message: gmail_v1.Schema$Message): { subject: string, from: string, fromEmail: string, body: string, snippet: string } {
    const payload = message.payload;
    const headers = (payload?.headers || []) as gmail_v1.Schema$MessagePartHeader[];
    const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || '';
    const fromHeader = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || '';
    const fromEmail = (fromHeader.match(/<(.+)>/) || [])[1] || fromHeader;
    const snippet = message.snippet || '';
    let body = '';
    const parts = payload?.parts as gmail_v1.Schema$MessagePart[] | undefined
    if (parts && parts.length) {
        const part = parts.find((p) => p.mimeType === 'text/plain') || parts.find((p) => p.mimeType === 'text/html');
        const data = part?.body?.data
        if (data) {
            const d = data.replace(/-/g, '+').replace(/_/g, '/');
            const pad = '='.repeat((4 - (d.length % 4)) % 4);
            body = Buffer.from(d + pad, 'base64').toString('utf-8');
        }
    } else if (payload?.body?.data) {
        const d = payload.body.data.replace(/-/g, '+').replace(/_/g, '/');
        const pad = '='.repeat((4 - (d.length % 4)) % 4);
        body = Buffer.from(d + pad, 'base64').toString('utf-8');
    }
    if (body.includes('<html')) {
        body = body.replace(/<style[^>]*>.*<\/style>/gs, '').replace(/<[^>]+>/g, '\n').replace(/\n{2,}/g, '\n');
    }
    return { subject, from: fromHeader, fromEmail, body, snippet };
}

async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

async function runAutopilotForUser(user: { id: string }) {
    console.log(`Running autopilot for user ${user.id}...`);
    if (!supabaseAdmin) {
        console.error('Supabase admin client not initialized');
        return 0;
    }
    const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('gmail_tokens')
        .select('refresh_token')
        .eq('user_id', user.id)
        .single();

    if (tokenError || !tokenData) {
        console.error(`No Gmail tokens for user ${user.id}`);
        return 0;
    }

    const accessToken = await getAccessToken(tokenData.refresh_token);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const profile = await gmail.users.getProfile({ userId: 'me' });
    const userEmail = profile.data.emailAddress;
    if (!userEmail) throw new Error(`Could not determine user email for user ${user.id}`);

    // Limit per user to reduce provider throttling
    const listRes = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
        maxResults: 5,
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) return 0;

    let repliedCount = 0;
    for (const messageHeader of messages) {
        if (!messageHeader.id) continue;
        const message = await gmail.users.messages.get({ userId: 'me', id: messageHeader.id });
        const { subject, fromEmail, body, snippet } = getEmailContent(message.data);

        if (fromEmail.toLowerCase() === userEmail.toLowerCase()) continue;

        const systemPrompt = `You are Donna...`; // Same prompt as before
        const userPrompt = `My goal is to be helpful... Email: ${body || snippet}`;

        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        });
        const draft = aiResponse.choices[0].message.content;
        if (!draft) continue;

        const replySubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
        const messageIdHeader =
          message.data.payload?.headers?.find(h => (h.name || '').toLowerCase() === 'message-id')?.value
        const inReplyTo = messageIdHeader || `<gmail-${message.data.id}@mail>`
        const raw = [
            `From: ${userEmail}`,
            `To: ${fromEmail}`,
            `Subject: ${replySubject}`,
            `In-Reply-To: ${inReplyTo}`,
            `References: ${inReplyTo}`,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset="UTF-8"',
            '',
            draft,
        ].join('\r\n');
        const base64EncodedEmail = Buffer.from(raw)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        // Send with a small jitter to avoid rate spikes
        await gmail.users.messages.send({ userId: 'me', requestBody: { raw: base64EncodedEmail, threadId: message.data.threadId } });
        await gmail.users.messages.modify({ userId: 'me', id: message.data.id!, requestBody: { removeLabelIds: ['UNREAD'] } });
        repliedCount++;
        await sleep(300 + Math.floor(Math.random() * 400)) // 300–700ms between sends
    }
    return repliedCount;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, autopilot_enabled')
      .eq('autopilot_enabled', true);

    if (error) throw new Error(error.message);

    // Cap users per run to reduce provider throttling; default 10
    const maxUsersPerRun = parseInt(process.env.AUTOPILOT_MAX_USERS_PER_RUN || '10', 10)
    const list = users || []
    let totalRepliedCount = 0;
    for (const user of list.slice(0, Math.max(0, maxUsersPerRun))) {
        try {
            totalRepliedCount += await runAutopilotForUser(user);
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err)
            console.error(`Failed to run autopilot for user ${user.id}:`, errMsg);
            Sentry.captureException(err)
            // Backoff briefly on user failure
            await sleep(500 + Math.floor(Math.random() * 500))
        }
    }

    return NextResponse.json({ success: true, summary: `Autopilot run complete. Total emails replied to: ${totalRepliedCount}.` });

  } catch (err: unknown) {
    console.error("Error in system-wide autopilot run:", err);
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Autopilot run failed' }, { status: 500 });
  }
}
