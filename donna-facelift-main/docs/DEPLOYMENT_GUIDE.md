# 🚀 DONNA Production Deployment Guide

## 📋 **Deployment Architecture**

### **What We're Keeping:**
- ✅ **Your existing PHP backend** (donna_logic.php, voice-chat.php, etc.)
- ✅ **Your existing Next.js frontend** (all React components)
- ✅ **Your existing database/file structure**

### **What We're Adding:**
- 🆕 **Node.js WebSocket Server** (for OpenAI Realtime API only)

### **Deployment Targets:**
- **Frontend** → **Vercel** (Next.js optimized)
- **PHP Backend + WebSocket Server** → **Railway** (supports both PHP and Node.js)

---

## 🎯 **Step 1: Deploy WebSocket Server to Railway**

### **1.1 Prepare WebSocket Server**
```bash
# Navigate to websocket server directory
cd websocket-server

# Install dependencies
npm install

# Test locally first
npm run dev
```

### **1.2 Create Railway Project**
1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project"
4. Choose "Deploy from GitHub repo"
5. Select your donna repository

### **1.3 Configure Railway for WebSocket Server**
In Railway dashboard:
1. **Root Directory**: Set to `websocket-server`
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`
4. **Environment Variables**:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   NODE_ENV=production
   FRONTEND_URL=https://your-donna-app.vercel.app
   ```

---

## 🎯 **Step 2: Deploy PHP Backend to Railway**

### **2.1 Option A: Same Railway Instance**
Add a second service in the same Railway project:
1. Click "Add Service"
2. Choose "GitHub Repo" 
3. **Root Directory**: Leave empty (uses root)
4. **Build Command**: (Railway auto-detects PHP)
5. **Environment Variables**:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   DEFAULT_VOICE_ID=XcXEQzuLXRU9RcfWzEJt
   ```

### **2.2 Option B: Keep PHP Elsewhere**
If you prefer, keep PHP on your current hosting and just deploy the WebSocket server to Railway.

---

## 🎯 **Step 3: Deploy Frontend to Vercel**

### **3.1 Prepare Frontend**
Update your environment variables in Vercel:
```bash
# In your .env.local or Vercel dashboard
NEXT_PUBLIC_API_BASE=https://your-php-backend.railway.app
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-websocket-server.railway.app/realtime
```

### **3.2 Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. **Framework Preset**: Next.js
4. **Root Directory**: Leave empty (uses root)
5. **Build Command**: `npm run build`
6. **Environment Variables**: Add the above variables

---

## 🔧 **Step 4: Update Frontend Configuration**

Update your React hooks to use the new WebSocket server:

### **4.1 Update WebSocket URL**
In your `hooks/use-openai-realtime.ts`:
```typescript
const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001/realtime'
```

### **4.2 Update API Base URL**
In your components:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || ''
```

---

## 🧪 **Step 5: Testing**

### **5.1 Test WebSocket Server**
```bash
# Test locally first
cd websocket-server
npm run dev

# Test endpoint
curl http://localhost:3001/health
curl http://localhost:3001/test
```

### **5.2 Test Full System**
1. **Chatbot**: Uses PHP backend (existing voice-chat.php)
2. **Receptionist**: Uses WebSocket server (new Realtime API)
3. **Both**: Should work independently

---

## 📊 **Expected URLs After Deployment**

### **Production URLs:**
- **Frontend**: `https://your-donna-app.vercel.app`
- **PHP Backend**: `https://your-php-backend.railway.app`
- **WebSocket Server**: `wss://your-websocket-server.railway.app/realtime`

### **API Endpoints:**
- **Batch Processing**: `https://your-php-backend.railway.app/api/voice-chat.php`
- **Realtime WebSocket**: `wss://your-websocket-server.railway.app/realtime`
- **Health Check**: `https://your-websocket-server.railway.app/health`

---

## 🔒 **Environment Variables Checklist**

### **WebSocket Server (Railway):**
```
OPENAI_API_KEY=sk-...
NODE_ENV=production
FRONTEND_URL=https://your-donna-app.vercel.app
PORT=3001
```

### **PHP Backend (Railway):**
```
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=sk_...
DEFAULT_VOICE_ID=XcXEQzuLXRU9RcfWzEJt
VOICE_MODEL=eleven_multilingual_v2
```

### **Frontend (Vercel):**
```
NEXT_PUBLIC_API_BASE=https://your-php-backend.railway.app
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-websocket-server.railway.app/realtime
```

---

## 🎉 **Benefits of This Architecture**

1. **✅ Minimal Changes**: Keep all your existing PHP code
2. **✅ Best Performance**: Vercel for frontend, Railway for backend
3. **✅ Scalable**: Each service can scale independently  
4. **✅ Cost Effective**: Railway free tier supports both services
5. **✅ Future Ready**: Easy to add more services (Google Meet, phone system)

---

## 🚀 **Ready to Deploy?**

1. **Test WebSocket server locally** first
2. **Deploy WebSocket server to Railway**
3. **Deploy/migrate PHP backend to Railway** (or keep current hosting)
4. **Deploy frontend to Vercel**
5. **Update environment variables**
6. **Test end-to-end**

Your DONNA system will be production-ready with this setup! 🎉
