# LoanPulse AI - Smart Loan Approval & Risk Intelligence System

A full-stack web application with an AI machine learning engine that predicts loan eligibility and risk for applicants, with complete database persistence in SQLite.

## Features

1. **AI Loan Eligibility Model**:
   - Trained on `loan_approval_data.csv` using a **Random Forest Classifier** achieving 86% validation accuracy.
   - Evaluates applicant eligibility (`APPROVED` vs `REJECTED`), confidence percentage, risk tier, and key financial ratios.

2. **Smart 20-Point Applicant Form**:
   - **⚡ Quick Fill Mode**: Enter just 5 core fields (Income, Credit Score, Loan Amount, Term, Employment). The remaining 14 optional details automatically use smart dataset defaults.
   - **📋 Full Application Mode**: Comprehensive entry for all 19 input details + applicant name.
   - **1-Click Demo Profiles**: Pre-loaded test cases for instant predictions.

3. **SQLite Database Persistence (`loan_applications.db`)**:
   - Every submitted application and ML prediction is automatically saved to SQLite database.
   - **Database Register Tab**: Interactive table to search, filter by status, export to CSV, and view full 20-point applicant records.

4. **Analytics Dashboard**:
   - Live metrics for total applications, approval rates, average credit scores, requested loan amounts, and model specs.

## Architecture

- **Frontend**: React 18 + Vite + Lucide Icons + Glassmorphic Design System
- **Backend API**: Python Flask REST API (`FrontEnd/backend/app.py`)
- **ML Engine**: Scikit-Learn Random Forest Classifier + SimpleImputer + StandardScaler + OneHotEncoder (`model_service.py`)
- **Database**: SQLite 3 (`loan_applications.db`)

## How to Run

### 1. Start the Flask Backend (Port 5000)
```bash
cd FrontEnd/backend
python app.py
```

### 2. Start the React Vite Frontend (Port 3000)
```bash
cd FrontEnd
npm install
npm run dev
```

Open `http://localhost:3000` in your web browser.
