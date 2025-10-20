

# RefillRadar (PillPilot)

## 🚀 Overview
RefillRadar (PillPilot) is an AI-powered caller app that helps users find hard-to-get prescription medications by automatically calling nearby pharmacies to check real-time availability and prices.

## 🧭 Core Idea
Patients and caregivers often struggle to locate in-stock medications, especially during shortages. PillPilot solves this pain point by using AI voice agents that call pharmacies, ask about medication availability and price, and deliver ranked, reliable results to users—all without manual phone calls.

## 🧩 Key Features
- Smart search by medication name, dosage, and search radius  
- AI voice caller for real-time pharmacy availability  
- Price comparison and ranking of pharmacies  
- Live dashboard with confidence scores for each result  
- SMS/email alerts when medications are restocked  
- Pharmacy opt-out & admin portal (planned/future)

## 🏗️ Architecture Overview
High-level stack summary:
- **Frontend:** Next.js + Tailwind CSS, deployed on Vercel  
- **Backend:** Next.js API routes, Supabase (Postgres for data, Auth for users)  
- **AI Voice:** Twilio or Vapi for calling, Deepgram/Whisper for transcription, GPT-4o-mini for extraction  
- **Queue/Scheduler:** Supabase cron jobs or Upstash QStash  
- **Notifications:** Postmark (email), Twilio (SMS)  
- **Monitoring:** PostHog (analytics), Sentry (errors), Logtail (logs)

## 📦 Data Model
Main database tables:
- `users`: Registered users and authentication  
- `searches`: Medication search requests  
- `pharmacies`: Pharmacy directory and contact info  
- `calls`: Outbound AI calls to pharmacies  
- `call_extractions`: AI-extracted data from call transcripts  
- `results`: Ranked pharmacy availability & pricing  
- `alerts`: Stock alert subscriptions and notifications

## 🤖 AI Caller Workflow
1. **Fetch**: Gather list of target pharmacies for the search  
2. **Call**: AI voice agent places calls to each pharmacy  
3. **Transcribe**: Record and transcribe the call audio  
4. **Extract**: Use AI to extract medication availability, price, and details  
5. **Update results**: Save, rank, and display results in the dashboard

## ⚙️ API Endpoints
Example endpoints:
- `POST /api/search` – Start a new pharmacy sweep  
- `GET /api/search/:id` – Retrieve ranked results for a search  
- `POST /api/alerts` – Subscribe to stock or price alerts  
- Internal webhooks for Twilio (call status) and transcription provider

## 🔒 Security & Privacy
- Minimal PHI (protected health info) storage  
- User consent required for recorded calls  
- Pharmacy opt-out policy for calls and data collection  
- Data encrypted at rest; access controls for sensitive data

## 📈 Roadmap
1. Core Search & Radius  
2. AI Caller MVP  
3. Extraction & Ranking  
4. Notifications (SMS/email)  
5. Admin Dashboard  
6. Analytics & Reliability Improvements

## 💡 Future Plans
- Pharmacy self-service portal for managing listings and opt-out  
- Integration with insurance and coupon data  
- Crowdsourced confirmations and user-submitted availability

## 🧠 Contributors
- Full-stack engineer  
- AI/Voice engineer  
- Product manager  
- Operations & support  


## 📄 License
MIT License