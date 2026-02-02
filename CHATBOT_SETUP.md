# DONNA Chatbot Setup Guide

## Overview

The DONNA chatbot is now integrated into your landing page! It features:

- ✅ Modern, responsive UI with floating chat button
- ✅ Message history and real-time responses
- ✅ Comprehensive knowledge base
- ✅ AI-powered responses (OpenAI or Anthropic)
- ✅ Fallback keyword-based responses

## Features

### 1. **Chatbot UI Component** (`components/chatbot.tsx`)
- Floating chat button in bottom-right corner
- Expandable chat window with message history
- Professional gradient design matching your brand
- Mobile-responsive
- Smooth animations

### 2. **API Endpoint** (`app/api/chatbot/route.ts`)
- Handles chat requests
- Integrates with OpenAI GPT-4 or Anthropic Claude
- Falls back to keyword-based responses if no API key
- Uses comprehensive knowledge base

### 3. **Knowledge Base** (`lib/chatbot-knowledge-base.json`)
- Complete information about DONNA
- All features, pricing, modules, industries
- FAQ responses
- Contact information

## Setup Instructions

### Option 1: Use AI-Powered Responses (Recommended)

#### Using OpenAI (GPT-4)

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)

2. Add to your `.env.local` file:
   ```env
   OPENAI_API_KEY=sk-...your-key-here
   ```

3. Add to Vercel environment variables:
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Add `OPENAI_API_KEY` with your key

#### Using Anthropic (Claude)

1. Get an API key from [Anthropic Console](https://console.anthropic.com/)

2. Add to your `.env.local` file:
   ```env
   ANTHROPIC_API_KEY=sk-ant-...your-key-here
   ```

3. Add to Vercel environment variables:
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Add `ANTHROPIC_API_KEY` with your key

### Option 2: Use Keyword-Based Responses (No API Key Required)

The chatbot will automatically fall back to keyword-based responses if no API keys are configured. This works out of the box but provides less natural conversations.

## How It Works

### AI-Powered Mode
1. User sends a message
2. API checks for OpenAI or Anthropic API key
3. Sends message + conversation history + knowledge base to AI
4. AI generates contextual response
5. Response displayed to user

### Keyword-Based Mode (Fallback)
1. User sends a message
2. API matches keywords in the message
3. Returns pre-written response based on topic
4. Response displayed to user

## Customization

### Update Knowledge Base

Edit `lib/chatbot-knowledge-base.json` to update:
- Company information
- Pricing details
- Features and modules
- FAQ responses
- Contact information

### Customize Appearance

Edit `components/chatbot.tsx` to change:
- Colors and gradients
- Button position
- Chat window size
- Message styling

### Modify AI Behavior

Edit the system prompt in `app/api/chatbot/route.ts` to:
- Change DONNA's personality
- Add specific instructions
- Emphasize certain topics
- Adjust response length

## Testing

### Local Testing
```bash
npm run dev
```

Visit `http://localhost:3000` and click the chat button in the bottom-right corner.

### Test Scenarios
1. **Greeting**: "Hi" or "Hello"
2. **Pricing**: "How much does it cost?"
3. **Features**: "What can DONNA do?"
4. **Security**: "Is my data safe?"
5. **Demo**: "I want a demo"

## Deployment

The chatbot is already integrated into your landing page. When you push to GitHub:

1. Changes auto-deploy to Vercel
2. Add environment variables in Vercel dashboard
3. Chatbot will be live on your production site

## Environment Variables Summary

Create a `.env.local` file in your project root:

```env
# Email Configuration (Siteground SMTP)
SMTP_HOST=your-siteground-smtp-host.com
SMTP_PORT=465
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-email-password

# Chatbot AI (choose one or both)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Troubleshooting

### Chatbot not responding
- Check browser console for errors
- Verify API endpoint is accessible at `/api/chatbot`
- Check environment variables are set correctly

### AI responses not working
- Verify API key is valid
- Check API key has sufficient credits
- Review API error logs in browser console

### Keyword responses only
- This is normal if no API keys are configured
- Add OpenAI or Anthropic API key to enable AI responses

## Next Steps

1. ✅ Chatbot UI created
2. ✅ API endpoint set up
3. ✅ AI integration ready
4. 🔄 Add API keys for AI-powered responses
5. 🔄 Test and refine responses
6. 🔄 Monitor usage and costs

## Support

For questions or issues:
- Email: info@bemdonna.com
- Support: support@bemdonna.com

## Cost Estimates

### OpenAI GPT-4o-mini
- ~$0.15 per 1M input tokens
- ~$0.60 per 1M output tokens
- Estimated: $0.01-0.05 per conversation

### Anthropic Claude Haiku
- ~$0.25 per 1M input tokens
- ~$1.25 per 1M output tokens
- Estimated: $0.01-0.05 per conversation

Both are very affordable for typical website traffic!

