# FaceVault — Facial Recognition Pipeline

![FaceVault](https://img.shields.io/badge/FaceVault-v1.0.0-bfa27a?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.6-009688?style=for-the-badge&logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![InsightFace](https://img.shields.io/badge/InsightFace-0.7.3-5a4e4e?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-bfa27a?style=for-the-badge)

A production-grade facial recognition pipeline built with deep learning. Enroll faces, run recognition, manage profiles, and audit every event, all through a secure, modern interface.

---

## Live Demo

🌐 **Frontend:** [facial-recognition-pipeline.vercel.app](https://facial-recognition-pipeline.vercel.app)  
🔌 **API:** [facevault-backend.onrender.com/api/health](https://facevault-backend.onrender.com/api/health)  
📖 **API Docs:** Available in development at `/api/docs`

---

## What It Does

FaceVault is a full-stack facial recognition system that allows users to:

- **Enroll** faces with custom labels into a personal vault
- **Recognize** faces by comparing against all enrolled profiles using deep learning embeddings
- **Manage profiles** — view, search, and delete enrolled faces
- **Audit** every recognition and enrollment event with timestamps
- **Secure** all data behind Clerk authentication — each user's vault is fully isolated

---

## Architecture

┌─────────────────────────────────────────────────────┐
│                    Client (Next.js 14)               │
│         TypeScript · Tailwind · Clerk Auth           │
└──────────────────────┬──────────────────────────────┘
│ HTTPS
┌──────────────────────▼──────────────────────────────┐
│                  FastAPI Backend                     │
│         Python 3.11 · SlowAPI Rate Limiting         │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  InsightFace│  │  SQLAlchemy  │  │Cloudinary │  │
│  │  ONNX Model │  │  PostgreSQL  │  │  Storage  │  │
│  └─────────────┘  └──────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────┘


### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Auth | Clerk |
| Backend | Python FastAPI, Uvicorn |
| ML Engine | InsightFace 0.7.3 + ONNX Runtime |
| Face Model | buffalo_sc (512-d embeddings) |
| Similarity | Cosine similarity (threshold: 0.40) |
| Database | PostgreSQL via Neon + SQLAlchemy ORM |
| Storage | Cloudinary |
| Rate Limiting | SlowAPI (100 req/hour/IP) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Why InsightFace over TensorFlow/DeepFace

During development, the initial TensorFlow/DeepFace implementation was profiled and found to require **~1.2GB RAM** at inference time — exceeding standard cloud deployment limits. The stack was migrated to InsightFace with ONNX Runtime, reducing memory to **~200MB** while maintaining equivalent recognition accuracy. This enables deployment on standard infrastructure without GPU requirements.

---

## Features

-  **Auth-gated vault** — every face belongs to one user, enforced at the DB level
-  **512-d face embeddings** — InsightFace buffalo_sc model via ONNX Runtime
-  **Model warm-up at startup** — zero cold-start latency on first request
-  **Rate limiting** — 100 requests/hour/IP via SlowAPI
-  **SQL injection safe** — all queries via SQLAlchemy ORM, no raw SQL
-  **XSS safe** — all user input sanitized and length-capped server-side
-  **Cloudinary storage** — images stored with face-crop transformation
-  **Audit logs** — full event history per user
-  **Mobile-first UI** — responsive with bottom nav on mobile
-  **Satin bronze design system** — `#1c1c1c`, `#5a4e4e`, `#bfa27a`

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11
- PostgreSQL database ([Neon](https://neon.tech) recommended)
- [Clerk](https://clerk.com) account
- [Cloudinary](https://cloudinary.com) account

### 1. Clone the repo

```bash
git clone https://github.com/Aisha-Aliyu/facial-recognition-pipeline.git
cd facial-recognition-pipeline

 2. Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

Create backend/.env:
DATABASE_URL=postgresql://user:password@host:5432/facevault
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
ALLOWED_ORIGINS=http://localhost:3000
ENVIRONMENT=development

Run the backend:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

3. Frontend setup
cd frontend
npm install

Create frontend/.env.local:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_API_URL=http://localhost:8000

Run the frontend:
npm run dev

API Reference
Health
GET /api/health

Auth
POST /api/auth/sync        — sync Clerk user to database

Faces
POST   /api/faces/enroll   — enroll a face (multipart: label + file)
POST   /api/faces/recognize — recognize a face (multipart: file)
GET    /api/faces/          — list all enrolled faces
DELETE /api/faces/{id}     — delete an enrolled face

Security
	•	All database queries use SQLAlchemy ORM — parameterized, no raw SQL
	•	User input sanitized server-side (label capped at 100 chars, stripped)
	•	CORS restricted to explicit allowed origins
	•	Rate limiting: 100 requests/hour per IP
	•	JWT verification on every protected route via Clerk
	•	Images stored in per-user Cloudinary folders
	•	Environment variables for all secrets — nothing hardcoded

Project Structure
facevault/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # faces, auth, health
│   │   ├── core/             # config, security
│   │   ├── db/               # database session
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # face_service, storage_service
│   │   └── main.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── dashboard/    # enroll, recognize, profiles, logs
    │   │   ├── sign-in/
    │   │   └── sign-up/
    │   └── lib/              # api client, keepAlive
    └── package.json

Deployment
Backend (Render)
	1.	Connect your GitHub repo to Render
	2.	Set Root Directory to backend
	3.	Set Build Command to pip install -r requirements.txt
	4.	Set Start Command to uvicorn app.main:app --host 0.0.0.0 --port $PORT
	5.	Add all environment variables from .env
	6.	Set ALLOWED_ORIGINS to your Vercel frontend URL
Frontend (Vercel)
	1.	Connect your GitHub repo to Vercel
	2.	Set Root Directory to frontend
	3.	Add all environment variables from .env.local
	4.	Set NEXT_PUBLIC_API_URL to your Render backend URL

License
MIT — free to use, modify, and deploy.

Built by Aisha · Powered by InsightFace + FastAPI + Next.js



