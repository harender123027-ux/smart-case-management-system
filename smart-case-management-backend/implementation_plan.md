The objective is to build a "Smart Case Management System" for police officers. The system will support complaint registration, case searching, evidence tracking, and predictive policing. The technology stack requires a Node.js/Express backend using PostgreSQL for data persistence, a React Native front end (Mobile App) using Expo, and integration with the Google Gemini API for AI-assisted capabilities.

## User Review Required
> [!IMPORTANT]
> - Do you already have a Google Gemini API key and PostgreSQL running locally? We will need these to run the application.
> - Do you already have a Google Gemini API key and PostgreSQL running locally? We will need these to run the application.
> - Please let me know if you have any UI/UX references for the React Native frontend.

## Proposed Changes

### Project Structure
- I will create two separate directories:
- **Backend**: `c:\Users\cctns\Documents\smart-case-management-backend` (Node.js/Express REST API)
- **Frontend**: `c:\Users\cctns\Documents\smart-case-management-frontend` (React Native with Expo)

### Backend (Node.js/Express + PostgreSQL + Gemini)
- Initialize a Node.js project using `npm init -y`.
- Install necessary dependencies (`express`, `cors`, `pg`, `sequelize` or raw queries, `dotenv`, `@google/genai`).
- **Database Schema Models**:
  - `User`: Officers and administrators.
  - `Complaint`: Information regarding public complaints.
  - `Case`: Official cases with status, assigned officer, etc.
  - `Evidence`: Tracked evidence items linked to specific cases. Supports file uploads (photo, video, pdf, document) and language options (Hindi or English).
- **API Endpoints**:
  - `POST /api/auth/login` (Authentication)
  - `POST /api/complaints`, `GET /api/complaints/:id` (Complaints CRUD)
  - `POST /api/cases`, `GET /api/cases`, `GET /api/cases/:id` (Case Management)
  - `POST /api/evidence`, `GET /api/evidence` (Evidence Tracking)
- **Gemini AI Integration**:
  - `POST /api/ai/search`: For natural language case/complaint searching.
  - `POST /api/ai/predictive`: To generate predictive policing insights based on historical case data.

### Frontend (React Native + Expo Mobile App)
- Initialize using `npx create-expo-app --template blank frontend`.
- **Internationalization**: Implement language toggle for **Hindi** and **English** across the app.
- **Screens**:
  - **Login Screen**: Authentication.
  - **Dashboard**: High-level overview, predictive policing alerts.
  - **Complaint Registration**: Form to register a new complaint.
  - **Case Search & List**: Interface with an AI-powered search bar leveraging Gemini.
  - **Evidence Tracker**: List of evidence, linking to cases.
- **Networking**: We will use `axios` to communicate with the local Node.js server.

## Verification Plan

### Automated Tests
- We will set up basic API tests testing the endpoints are responsive and schemas are valid.

### Manual Verification
- We will ensure `PostgreSQL` is running and all migrations/tables are created.
- We will run the backend server (`npm run dev`) on a specific port (e.g., 3000).
- We will run the Expo server (`npx expo start`) locally to verify it connects to the backend and the UI components render without errors.
- We will manually test the Gemini integration endpoints using `curl` to ensure AI parses/predicts correctly with sample data.
