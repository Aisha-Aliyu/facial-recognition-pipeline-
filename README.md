# FaceVault

A face recognition app with a Python backend. You can enroll faces with a name, recognise a face from a new photo, manage the people you've saved, and see a log of every enrollment and recognition.

- Live demo: https://facial-recognition-pipeline.vercel.app
- API health check: https://facevault-backend.onrender.com/api/health

Tap Try It Free to use FaceVault without an account. Guest mode keeps the vault in your own browser: the API turns each photo into an embedding and stores nothing, and matching happens in the browser. Sign in to keep a private vault on the server, with an audit log.

The API runs on Render's free plan, which sleeps after 15 minutes without visitors. The dashboard starts waking it as soon as it opens and shows when the face engine is ready. The first request after a quiet spell can take about a minute.

## What it does

- Enroll faces with a label into your own vault.
- Recognise a face by comparing it against everyone you've enrolled.
- View, search and delete enrolled faces.
- See an audit log of every enrollment and recognition, with timestamps.
- Each signed in user's vault is kept separate, and the database enforces it.

## How it works

The Next.js frontend (TypeScript, Tailwind CSS and Clerk for sign in) talks to a FastAPI backend over HTTPS. The backend uses InsightFace's buffalo_sc model through ONNX Runtime to turn each face into a 512 dimension embedding, then compares embeddings with cosine similarity (a match needs a score of 0.40 or more). Data is stored in PostgreSQL on Neon through SQLAlchemy, and images go to Cloudinary with a face crop applied.

### Why InsightFace and not DeepFace

My first version used DeepFace on TensorFlow, but it needed about 1.2 GB of RAM at inference, which is more than standard cloud plans allow. I moved to InsightFace with ONNX Runtime, which brought memory down to about 200 MB with similar accuracy, and it doesn't need a GPU.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Auth: Clerk
- Backend: Python, FastAPI, Uvicorn
- Face model: InsightFace 0.7.3 (buffalo_sc) with ONNX Runtime
- Matching: cosine similarity, threshold 0.40
- Database: PostgreSQL on Neon, through SQLAlchemy
- Image storage: Cloudinary
- Rate limiting: SlowAPI, 100 requests per hour per IP
- Hosting: Vercel for the frontend, Render for the backend

## Other details

- The model is loaded once when the server starts, not on the first request.
- The layout is built for phones first, with a bottom navigation bar on small screens.
- The colour palette is #1c1c1c, #5a4e4e and #bfa27a.

## Run it locally

You'll need Node.js 18 or newer, Python 3.11, a PostgreSQL database (Neon works well), a Clerk account and a Cloudinary account.

```bash
git clone https://github.com/Aisha-Aliyu/facial-recognition-pipeline-.git
cd facial-recognition-pipeline-/facevault
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend`:

```env
DATABASE_URL=postgresql://user:password@host:5432/facevault
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
ALLOWED_ORIGINS=http://localhost:3000
ENVIRONMENT=development
```

Start it:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

In development, the API docs are at http://localhost:8000/api/docs.

### Frontend

In a second terminal, from the `facevault` folder:

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then run `npm run dev`.

## API

```
GET    /api/health
POST   /api/auth/sync          save the signed in Clerk user to the database
POST   /api/faces/enroll       enroll a face (multipart: label and file)
POST   /api/faces/recognize    recognise a face (multipart: file), best matches first
GET    /api/faces/logs         audit log (?limit=50)
GET    /api/faces/             list enrolled faces
DELETE /api/faces/{id}         delete an enrolled face
POST   /api/guest/embed        guest mode: photo to embedding, nothing stored (multipart: file and purpose)
```

## Security

- Every database query goes through the SQLAlchemy ORM, so queries are parameterised and there's no raw SQL.
- User input is cleaned on the server, and labels are capped at 100 characters.
- CORS only allows the origins listed in `ALLOWED_ORIGINS`.
- Rate limiting at 100 requests per hour per IP.
- Clerk JWTs are verified on every protected route.
- Images are stored in a separate Cloudinary folder for each user.
- All secrets come from environment variables. Nothing is hardcoded.

## Deployment

Backend on Render:

1. Connect the GitHub repo to Render.
2. Set the Root Directory to `facevault/backend`.
3. Set the Build Command to `pip install -r requirements.txt`.
4. Set the Start Command to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Add the environment variables from `facevault/backend/.env`.
6. Set `ALLOWED_ORIGINS` to your Vercel frontend URL.

Frontend on Vercel:

1. Import the GitHub repo into Vercel.
2. Set the Root Directory to `facevault/frontend`.
3. Add the environment variables from `facevault/frontend/.env.local`.
4. Set `NEXT_PUBLIC_API_URL` to your Render backend URL.

## License

MIT
