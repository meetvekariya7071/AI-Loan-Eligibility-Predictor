from flask import Flask, request, jsonify
from flask_cors import CORS
from model_service import LoanPredictorModel

app = Flask(__name__)
CORS(app)

# Initialize Model Engine
predictor = LoanPredictorModel()

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "model": "Random Forest Classifier",
        "dataset_source": "loan_approval_data.csv",
        "sqlite_database": "loan_applications.db",
        "mongodb": predictor.get_mongodb_status()
    })

@app.route('/api/defaults', methods=['GET'])
def get_defaults():
    return jsonify({
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
    })

@app.route('/api/presets', methods=['GET'])
def get_presets():
    return jsonify({
        "presets": [
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
                "description": "Only 5 key fields provided! Smart AI defaults fill the remaining 14 fields.",
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
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.json or {}
        result = predictor.predict_and_save(data)
        return jsonify({
            "success": True,
            "data": result
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

@app.route('/api/applications', methods=['GET'])
def get_applications():
    search = request.args.get('search', '')
    status = request.args.get('status', 'All')
    limit = int(request.args.get('limit', 2000))
    sort_order = request.args.get('sort', 'ASC')
    applications = predictor.get_applications(search, status, limit, sort_order)
    return jsonify({
        "success": True,
        "count": len(applications),
        "applications": applications
    })

@app.route('/api/stats', methods=['GET'])
def get_stats():
    stats = predictor.get_stats()
    return jsonify({
        "success": True,
        "stats": stats
    })

@app.route('/api/mongodb/connect', methods=['POST'])
def connect_mongodb():
    data = request.json or {}
    uri = data.get('uri', 'mongodb://localhost:27017/').strip()
    result = predictor.connect_mongodb(uri, auto_sync=True)
    return jsonify(result)

@app.route('/api/mongodb/status', methods=['GET'])
def get_mongodb_status():
    status = predictor.get_mongodb_status()
    return jsonify({
        "success": True,
        "mongodb": status
    })

if __name__ == '__main__':
    print("[Flask Server] Starting Loan Eligibility AI Backend on http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
