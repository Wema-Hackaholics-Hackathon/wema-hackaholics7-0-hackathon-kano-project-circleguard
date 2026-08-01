# CircleGuard

## Team Members

1. Adelopo Abdullah - Lead (09041976621)
2. Ibrahim Idris - (08109979077)
3. Ahmad Musa - (07046961233)
4. Khalid Jubril Muhammad - (08123734694)

## 🚀 Live Demo

**Live Application:** [https://circleguard.vercel.app/](https://circleguard.vercel.app/)

**Backend API:** Integrated into the Next.js application.

**Recorded Demo:** https://www.loom.com/share/3d06ec4130f7456e90e9a8ccfb1e2283

## 🎯 The Problem

**How might we make informal savings circles (ajo) safer and more reliable by identifying possible contribution defaults early without exposing members’ private banking information?**

## ✨ Our Solution

CircleGuard is a privacy-first digital ajo platform. Members connect their bank accounts so the system can privately analyse transaction trends, contribution behaviour, and affordability. CircleGuard predicts who may default, checks whether users can safely afford a circle before joining, and applies Guard protection to reduce risk. Administrators only see readiness results and never see members’ raw balances or transaction histories.

## 🛠️ Tech Stack

**Frontend:** React, Next.js, TypeScript, Tailwind CSS

**Backend:** Next.js Server Actions and API Routes

**Database:** PostgreSQL via Supabase

**Deployment:** Vercel

**AI/APIs:** Open Banking Nigeria-compatible sandbox data, Supabase APIs, and CircleGuard’s trend and readiness engine

## ⚙️ How to Set Up and Run Locally

Clone the repository:

```bash
git clone git@github.com:ade-tech/circleGuard.git
```

Navigate to the project directory:

```bash
cd circleGuard
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file and add the necessary environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Run the development server:

```bash
npm run dev
```
