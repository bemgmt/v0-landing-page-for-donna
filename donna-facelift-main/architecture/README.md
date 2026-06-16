# 🧠 DONNA Platform Architecture Documentation

## Executive Summary

DONNA is a sophisticated AI-powered business automation platform that combines modern web technologies to provide multiple AI personas with both batch and real-time voice capabilities. The platform serves as a comprehensive business assistant with specialized interfaces for sales, marketing, receptionist, and secretary functions.

## Architecture Overview

DONNA employs a **hybrid architecture** combining:
- **Next.js 14** frontend with App Router
- **PHP backend** for core AI processing and business logic
- **Node.js WebSocket server** for real-time voice communication
- **Multiple third-party integrations** (OpenAI, ElevenLabs, Gmail API)

## Key Features

- **Multi-Persona AI System**: Sales, Marketing, Receptionist, Secretary profiles
- **Dual Voice Processing**: Batch (high-quality) and Real-time (low-latency) modes
- **Interactive Dashboard**: 3D grid-based interface for different business functions
- **Email Integration**: Gmail API integration for email management
- **Voice Synthesis**: Custom ElevenLabs voice with OpenAI Realtime API
- **Embeddable Widget**: Standalone chatbot widget for external websites

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives with custom styling
- **Animation**: Framer Motion for smooth transitions
- **State Management**: React hooks and context

### Backend
- **Primary**: PHP 8+ with cURL for API calls
- **Real-time**: Node.js with WebSocket support
- **Data Storage**: File-based JSON storage (expandable to database)
- **Environment**: XAMPP/LAMP stack compatible

### External Services
- **OpenAI**: GPT-4, Whisper, Realtime API
- **ElevenLabs**: Custom voice synthesis
- **Gmail API**: Email integration
- **WebSocket**: Real-time communication

## Directory Structure

```
donna/
├── architecture/           # This documentation
├── app/                   # Next.js App Router
├── api/                   # PHP backend endpoints
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Shared utilities and types
├── voice_system/          # Voice processing clients
├── websocket-server/      # Node.js WebSocket server
├── public/                # Static assets
└── public_html/           # Legacy PHP structure
```

## Documentation Files

- [Frontend Architecture](./frontend-architecture.md) - React components and Next.js structure
- [Backend API Structure](./backend-api-structure.md) - PHP endpoints and business logic
- [Voice System Architecture](./voice-system-architecture.md) - Audio processing and synthesis
- [Third-Party Integrations](./third-party-integrations.md) - External API integrations
- [Data Flow & State Management](./data-flow-state-management.md) - Application data patterns
- [Deployment & Configuration](./deployment-configuration.md) - Setup and deployment guide
- [Security & Performance](./security-performance.md) - Security considerations and optimization
- [Component Reference](./component-reference.md) - Detailed component documentation
- [API Reference](./api-reference.md) - Complete API endpoint documentation

## Quick Start

1. **Environment Setup**: Configure `.env` file with API keys
2. **Dependencies**: Install Node.js and PHP dependencies
3. **Database**: Set up file-based storage (or database)
4. **Services**: Start WebSocket server and PHP backend
5. **Frontend**: Run Next.js development server

## Architecture Principles

- **Modularity**: Clear separation of concerns between frontend, backend, and services
- **Scalability**: Designed to handle multiple concurrent users and AI personas
- **Extensibility**: Easy to add new AI personas and business functions
- **Performance**: Optimized for both batch and real-time processing
- **Security**: API key management and CORS configuration

## Development Workflow

1. **Frontend Development**: React components with TypeScript
2. **Backend Development**: PHP API endpoints with JSON responses
3. **Voice Integration**: WebSocket-based real-time communication
4. **Testing**: Component testing and API endpoint validation
5. **Deployment**: Vercel (frontend) + shared hosting (backend)

## Support & Maintenance

- **Monitoring**: Health check endpoints and service status
- **Logging**: Error logging and conversation tracking
- **Updates**: Modular update system for individual components
- **Documentation**: Comprehensive API and component documentation

---

*This documentation is maintained alongside the codebase and updated with each major release.*

