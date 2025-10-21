# RefillRadar Development Guide

## Project Overview
RefillRadar (PillPilot) is an AI-powered web application that helps users find prescription medications by automatically calling pharmacies to check availability and prices.

## Application Status
✅ **COMPLETE** - Full web application with all requested features:
- Landing page with modern gradient design matching the provided UI mockup
- Login/signup page with authentication forms
- Dashboard with interactive map and pharmacy search functionality
- Payment options modal ($1 per pharmacy vs $50/month subscription)
- Prescription input form with zipcode and radius selection
- Real-time pharmacy markers on interactive map
- Mock search results with availability, pricing, and confidence scores

## Pages Created
1. **Landing Page** (`/`) - Hero section, features, pricing preview
2. **Login Page** (`/login`) - Authentication with social login options
3. **Dashboard** (`/dashboard`) - Main application interface with map and search

## Tech Stack
- **Frontend/Backend**: Next.js (full-stack with API routes)
- **Database**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **AI Voice**: Twilio/Vapi + Deepgram/Whisper + elevellabs
- **Queue/Scheduler**: Supabase cron jobs or Upstash QStash
- **Notifications**: Postmark (email), Twilio (SMS)
- **Monitoring**: PostHog, Sentry, Logtail
- **Deployment**: Vercel

## Repository Structure
This project uses a **single repository** approach since:
- Next.js handles both frontend and backend in one framework
- API routes provide backend functionality
- Simpler deployment and development workflow
- Shared types and utilities between frontend/backend

## Database Schema
Core tables:
- `users` - User auth and profiles
- `searches` - Medication search requests
- `pharmacies` - Pharmacy directory
- `calls` - AI call records
- `call_extractions` - AI-extracted call data
- `results` - Ranked pharmacy results
- `alerts` - Stock alert subscriptions

## API Endpoints
- `POST /api/search` - Start pharmacy sweep
- `GET /api/search/:id` - Get search results
- `POST /api/alerts` - Subscribe to alerts
- Webhook endpoints for Twilio callbacks

## Development Commands
```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check TypeScript
npm run type-check
```

## Current Features
- **Landing Page**: Modern gradient design with hero section, feature highlights, problem/solution sections, and pricing preview
- **Authentication**: Login/signup forms with social authentication options (Google, Facebook)
- **Dashboard**: Interactive map with Leaflet showing pharmacy locations within user-defined radius
- **Search Form**: Medication name, dosage, zipcode input with radius slider (1-25 miles)
- **Payment Modal**: Choice between $1 per pharmacy called or $50/month unlimited subscription
- **Search Results**: Mock pharmacy data showing availability, pricing, confidence scores, and last checked timestamps
- **Responsive Design**: Works on desktop and mobile devices

## Mock Data
The application currently uses mock pharmacy data and simulated search results. Real implementation would require:
- Integration with pharmacy APIs or databases
- AI voice calling system (Twilio/Vapi)
- Payment processing (Stripe)
- User authentication system
- Geolocation services for accurate pharmacy mapping

## Environment Variables Needed
```
# Database
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# AI/Voice
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
OPENAI_API_KEY=
DEEPGRAM_API_KEY=

# Notifications
POSTMARK_API_TOKEN=

# Analytics
POSTHOG_PROJECT_API_KEY=
SENTRY_DSN=

# Auth
NEXTAUTH_URL=
NEXTAUTH_SECRET=
```

## Security Considerations
- Minimal PHI storage
- User consent for call recordings
- Pharmacy opt-out policies
- Data encryption at rest
- Access controls for sensitive data

## Development Phases
1. Core Search & Radius functionality
2. AI Caller MVP
3. Extraction & Ranking system
4. Notifications (SMS/email)
5. Admin Dashboard
6. Analytics & Reliability

## Key Features to Implement
- Smart medication search with radius
- AI voice caller for real-time availability
- Price comparison and pharmacy ranking
- Live dashboard with confidence scores
- SMS/email restock alerts
- Pharmacy opt-out portal (future)