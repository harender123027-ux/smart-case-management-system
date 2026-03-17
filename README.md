# Smart Case Management System (SCMS)

An AI-powered digital infrastructure for modern law enforcement. SCMS streamlines complaint registration, case tracking, evidence management, and predictive policing using advanced AI.

## 🚀 Project Overview

This repository contains the full stack for the Smart Case Management System, organized into three main components:

- **`smart-case-management-backend`**: Node.js/Express API with PostgreSQL database, integrated with Google Gemini AI.
- **`smart-case-management-web`**: Premium React + Vite web dashboard featuring glassmorphism UI and real-time intelligence.
- **`smart-case-management-frontend`**: React Native (Expo) mobile application for field officers.

## ✨ Key Features

- **AI-Driven Complaint Registration**: Automated parsing of reports and voice-to-text input.
- **Predictive Policing**: Strategic forecasts and crime hotspot analysis using Gemini AI neural engine.
- **Legal Intelligence**: Instant suggestions of applicable BNS/BNSS acts from case documents.
- **Secure Evidence Vault**: Digital chain of custody with support for photos, audio, and documents.
- **Universal Case Search**: Natural language search powered by AI.

## 🛠️ Tech Stack

- **Frontend**: React (Web), React Native/Expo (Mobile), Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, PostgreSQL.
- **AI**: Google Gemini Pro & Flash models.
- **Styling**: Modern CSS with Glassmorphism effects.

## ⚙️ Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL
- Google Gemini API Key

### 2. Backend Setup
```bash
cd smart-case-management-backend
npm install
# Configure your .env file with DB and Gemini credentials
node src/migrations/migrate.js  # Setup database schema
npm run dev
```

### 3. Web Frontend Setup
```bash
cd smart-case-management-web
npm install
npm run dev
```

### 4. Mobile Setup
```bash
cd smart-case-management-frontend
npm install
npx expo start
```

## 📜 Legal Acts Reference
The system includes built-in reference and intelligent parsing for:
- Bharatiya Nyaya Sanhita (BNS)
- Bharatiya Nagarik Suraksha Sanhita (BNSS)
- Bharatiya Sakshya Adhiniyam (BSA)

---
Developed with ❤️ for Modern Policing.
