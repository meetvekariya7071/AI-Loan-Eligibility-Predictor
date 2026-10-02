import os
import sys
import json
from http.server import BaseHTTPRequestHandler

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from index import get_presets

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            from model_service import LoanPredictorModel
            presets_data = [
                {
                    "name": "High Approval Candidate",
                    "description": "High credit score, steady salaried income, low DTI, high savings.",
                    "data": {
                        "Applicant_Name": "Robert Vance",
                        "Applicant_Income": 18500,
                        "Coapplicant_Income": 4500,
                        "Age": 38,
                        "Dependents": 1,
                        "Credit_Score": 760,
                        "Existing_Loans": 1,
                        "DTI_Ratio": 0.22,
                        "Savings": 28000,
                        "Collateral_Value": 45000,
                        "Loan_Amount": 25000,
                        "Loan_Term": 36,
                        "Employment_Status": "Salaried",
                        "Marital_Status": "Married",
                        "Loan_Purpose": "Home",
                        "Property_Area": "Urban",
                        "Gender": "Male",
                        "Employer_Category": "MNC",
                        "Education_Level": "Graduate"
                    }
                },
                {
                    "name": "Quick Fill (Essential Only)",
                    "description": "Only 5 key fields provided! Smart AI defaults fill remaining fields.",
                    "data": {
                        "Applicant_Name": "Sophia Taylor",
                        "Applicant_Income": 12000,
                        "Credit_Score": 710,
                        "Loan_Amount": 15000,
                        "Loan_Term": 24,
                        "Employment_Status": "Salaried"
                    }
                },
                {
                    "name": "High Risk Candidate",
                    "description": "Low credit score, high existing debt ratio, zero savings.",
                    "data": {
                        "Applicant_Name": "James Miller",
                        "Applicant_Income": 4500,
                        "Coapplicant_Income": 0,
                        "Age": 24,
                        "Dependents": 3,
                        "Credit_Score": 510,
                        "Existing_Loans": 4,
                        "DTI_Ratio": 0.65,
                        "Savings": 500,
                        "Collateral_Value": 0,
                        "Loan_Amount": 35000,
                        "Loan_Term": 72,
                        "Employment_Status": "Unemployed",
                        "Marital_Status": "Single",
                        "Loan_Purpose": "Personal",
                        "Property_Area": "Rural",
                        "Gender": "Male",
                        "Employer_Category": "Unemployed",
                        "Education_Level": "Not Graduate"
                    }
                },
                {
                    "name": "Self-Employed Entrepreneur",
                    "description": "Moderate income, substantial collateral, average credit score.",
                    "data": {
                        "Applicant_Name": "Elena Rostova",
                        "Applicant_Income": 14000,
                        "Coapplicant_Income": 2500,
                        "Age": 32,
                        "Dependents": 0,
                        "Credit_Score": 665,
                        "Existing_Loans": 2,
                        "DTI_Ratio": 0.38,
                        "Savings": 12500,
                        "Collateral_Value": 38000,
                        "Loan_Amount": 20000,
                        "Loan_Term": 48,
                        "Employment_Status": "Self-employed",
                        "Marital_Status": "Single",
                        "Loan_Purpose": "Business",
                        "Property_Area": "Semiurban",
                        "Gender": "Female",
                        "Employer_Category": "Self-employed",
                        "Education_Level": "Graduate"
                    }
                }
            ]
            response_bytes = json.dumps({"presets": presets_data}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response_bytes)
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
