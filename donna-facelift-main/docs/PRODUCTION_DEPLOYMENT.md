# 🚀 DONNA Lead Generation - Production Deployment Guide

## Phase 5: Complete Lead Generation System

This deployment includes a comprehensive lead generation system with Octoparse integration, job management, and real-time monitoring.

## 🎯 **System Overview**

### **Core Components**
- ✅ **Octoparse API Integration** - OAuth2 authentication with token management
- ✅ **Job Management System** - Background processing with monitoring
- ✅ **Real-time Webhooks** - Automatic status updates and data import
- ✅ **Health Monitoring** - System diagnostics and alerts
- ✅ **Data Management** - Lead storage, validation, and export
- ✅ **Production Configuration** - Optimized for Vercel deployment

## 🔧 **Environment Variables**

### **Required Variables (Set in Vercel Dashboard)**
```bash
# Octoparse API Credentials
OCTOPARSE_USERNAME=bemgmt
OCTOPARSE_PASSWORD=ZsArM@zfBgDd!A9

# Database Configuration
DB_HOST=localhost
DB_NAME=db6xyrvg7ki2fm
DB_USER=u0xcevqromziu
DB_PASS=Om1lf$51(|6)

# System Configuration
ADMIN_EMAIL=derek@birdseyemanagementservices.com
DOMAIN_NAME=donna-interactive-grid.vercel.app
ENVIRONMENT=production

# Optional: SMTP for notifications
SMTP_HOST=smtp.gmail.com
SMTP_USER=djtalbird@gmail.com
SMTP_PASS=fcqejjzgahrsuija
```

## 📁 **File Structure**

```
donna/
├── api/                          # API endpoints
│   ├── business-leads.php        # Main leads API
│   ├── health.php               # Health check endpoint
│   └── webhooks/
│       └── octoparse.php        # Webhook handler
├── lead_generation/             # Core lead generation system
│   ├── octoparse_auth.php       # OAuth2 authentication
│   ├── octoparse_api.php        # API client
│   ├── job_manager.php          # Job processing
│   ├── config.php               # Configuration
│   ├── db_connection.php        # Database connection
│   ├── cache/                   # Token cache
│   └── logs/                    # System logs
├── interactive-grid-dashboard/   # Next.js frontend
└── vercel.json                  # Vercel configuration
```

## 🚀 **Deployment Steps**

### **1. Vercel Deployment**
The system auto-deploys when you push to GitHub:

```bash
git add .
git commit -m "Phase 5: Complete Lead Generation System - Production Ready"
git push origin phase5-production-ready
```

### **2. Environment Variables Setup**
In Vercel Dashboard → Settings → Environment Variables, add:

| Variable | Value | Description |
|----------|-------|-------------|
| `OCTOPARSE_USERNAME` | `bemgmt` | Octoparse account username |
| `OCTOPARSE_PASSWORD` | `ZsArM@zfBgDd!A9` | Octoparse account password |
| `DB_HOST` | `localhost` | Database host |
| `DB_NAME` | `db6xyrvg7ki2fm` | Database name |
| `DB_USER` | `u0xcevqromziu` | Database username |
| `DB_PASS` | `Om1lf$51(|6)` | Database password |
| `ADMIN_EMAIL` | `derek@birdseyemanagementservices.com` | Admin notifications |

### **3. Database Setup**
The system automatically creates required tables on first run:
- `octoparse_jobs` - Job tracking and status
- `lead_data` - Lead information storage

## 🔍 **API Endpoints**

### **Business Leads API** (`/api/business-leads`)
- `GET` - List leads with pagination and filtering
- `POST` - Create jobs, import data, bulk operations
- `PUT` - Update lead information
- `DELETE` - Remove leads or jobs

### **Health Check** (`/api/health`)
- `GET` - System health status and diagnostics

### **Webhooks** (`/api/webhooks/octoparse`)
- `POST` - Receive Octoparse job status updates

## 📊 **Usage Examples**

### **Create a Lead Generation Job**
```javascript
const response = await fetch('/api/business-leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create_job',
    task_id: 'your_octoparse_task_id',
    task_name: 'Google Business Listings - Restaurants NYC',
    parameters: {
      search_term: 'restaurants in New York',
      max_results: 100
    }
  })
});
```

### **Get Lead Data**
```javascript
const leads = await fetch('/api/business-leads?action=list&page=1&limit=20');
const data = await leads.json();
```

### **Check System Health**
```javascript
const health = await fetch('/api/health');
const status = await health.json();
```

## 🔧 **Monitoring & Maintenance**

### **Health Monitoring**
- Visit: `https://donna-interactive-grid.vercel.app/api/health`
- Monitor database connectivity, API access, and job queue

### **Log Files**
- Authentication: `lead_generation/logs/octoparse_auth.log`
- Job Management: `lead_generation/logs/job_manager.log`
- Webhooks: `lead_generation/logs/webhooks.log`

### **Job Management**
- Jobs are automatically processed in the background
- Failed jobs are logged with error details
- Completed jobs trigger automatic data import

## 🛡️ **Security Features**

- ✅ **Token Caching** - Secure OAuth2 token management
- ✅ **Input Validation** - All API inputs are validated
- ✅ **Error Handling** - Comprehensive error logging
- ✅ **Rate Limiting** - Built-in API rate limiting
- ✅ **Webhook Security** - Signature verification for webhooks

## 🎯 **Production Features**

### **Automatic Processing**
- Jobs are queued and processed automatically
- Real-time status updates via webhooks
- Automatic data import when jobs complete

### **Data Management**
- Lead deduplication and validation
- Export capabilities (JSON, CSV)
- Bulk import functionality

### **Monitoring**
- Health checks for all system components
- Job queue monitoring
- Performance metrics

## 🔗 **Live URLs**

- **Frontend**: https://donna-interactive-grid.vercel.app
- **API Health**: https://donna-interactive-grid.vercel.app/api/health
- **Business Leads API**: https://donna-interactive-grid.vercel.app/api/business-leads

## 📞 **Support**

For issues or questions:
- **Email**: derek@birdseyemanagementservices.com
- **System Logs**: Check Vercel function logs
- **Health Status**: Monitor `/api/health` endpoint

---

## ✅ **Deployment Checklist**

- [ ] Environment variables configured in Vercel
- [ ] Database connection tested
- [ ] Octoparse API credentials validated
- [ ] Health check endpoint responding
- [ ] Webhook endpoint configured
- [ ] Frontend deployment successful
- [ ] API endpoints tested

**🎉 Your Phase 5 Lead Generation System is now production-ready!**
