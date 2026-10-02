import os
import sys
import json
from http.server import BaseHTTPRequestHandler

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from model_service import LoanPredictorModel

predictor = LoanPredictorModel()

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            res_data = {
                "defaults": predictor.defaults,
                "categorical_options": {
                    "Employment_Status": ["Salaried", "Self-employed", "Unemployed"],
                    "Marital_Status": ["Single", "Married"],
                    "Loan_Purpose": ["Personal", "Car", "Business", "Home", "Education"],
                    "Property_Area": ["Urban", "Semiurban", "Rural"],
                    "Gender": ["Male", "Female"],
                    "Employer_Category": ["Private", "Government", "MNC", "Unemployed", "Self-employed"],
                    "Education_Level": ["Graduate", "Not Graduate"]
                }
            }
            response_bytes = json.dumps(res_data).encode('utf-8')
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
