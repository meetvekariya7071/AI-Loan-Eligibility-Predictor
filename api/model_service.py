import os
import sys
import io
import joblib
import pandas as pd
import numpy as np

# Force UTF-8 encoding on Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier

class LoanPredictorModel:
    def __init__(self):
        self.num_cols = [
            'Applicant_Income', 'Coapplicant_Income', 'Age', 'Dependents', 
            'Credit_Score', 'Existing_Loans', 'DTI_Ratio', 'Savings', 
            'Collateral_Value', 'Loan_Amount', 'Loan_Term'
        ]
        self.cat_cols = [
            'Employment_Status', 'Marital_Status', 'Loan_Purpose', 
            'Property_Area', 'Gender', 'Employer_Category'
        ]
        
        self.num_imputer = None
        self.cat_imputer = None
        self.education_encoder = None
        self.ohe_encoder = None
        self.scaler = None
        self.model = None
        self.feature_columns = None
        self.defaults = {}
        
        self.historical_applications = []
        self.recent_predictions = []
        
        joblib_path = os.path.join(os.path.dirname(__file__), "model.joblib")
        if os.path.exists(joblib_path):
            try:
                artifact = joblib.load(joblib_path)
                self.model = artifact['model']
                self.scaler = artifact['scaler']
                self.num_imputer = artifact['num_imputer']
                self.cat_imputer = artifact['cat_imputer']
                self.education_encoder = artifact.get('education_encoder')
                self.ohe_encoder = artifact.get('ohe_encoder')
                self.feature_columns = artifact['feature_columns']
                self.defaults = artifact['defaults']
                self.historical_applications = artifact['historical_applications']
                self.num_cols = artifact['num_cols']
                self.cat_cols = artifact['cat_cols']
                print(f"[ML Engine] Loaded pre-trained model.joblib successfully with {len(self.historical_applications)} records.")
                return
            except Exception as e:
                print(f"[ML Engine] Could not load model.joblib: {e}, falling back to training from CSV.")

        self._find_and_load_dataset()
        self._train_model()

    def _find_and_load_dataset(self):
        possible_paths = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), "data", "loan_approval_data.csv")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Modal train", "loan_approval_data.csv")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "loan_approval_data.csv")),
            os.path.abspath(os.path.join(os.getcwd(), "Modal train", "loan_approval_data.csv")),
            os.path.abspath(os.path.join(os.getcwd(), "api", "data", "loan_approval_data.csv")),
        ]
        
        self.dataset_path = None
        for p in possible_paths:
            if os.path.exists(p):
                self.dataset_path = p
                break
                
        if not self.dataset_path:
            self.raw_df = pd.DataFrame({
                'Applicant_Income': [5000, 10000, 15000],
                'Coapplicant_Income': [0, 2000, 3000],
                'Age': [30, 40, 35],
                'Dependents': [0, 1, 2],
                'Credit_Score': [600, 700, 800],
                'Existing_Loans': [1, 2, 0],
                'DTI_Ratio': [0.4, 0.3, 0.2],
                'Savings': [1000, 5000, 20000],
                'Collateral_Value': [0, 10000, 30000],
                'Loan_Amount': [10000, 20000, 25000],
                'Loan_Term': [36, 36, 48],
                'Employment_Status': ['Salaried', 'Self-employed', 'Salaried'],
                'Marital_Status': ['Single', 'Married', 'Married'],
                'Loan_Purpose': ['Personal', 'Home', 'Home'],
                'Property_Area': ['Urban', 'Rural', 'Urban'],
                'Gender': ['Male', 'Female', 'Male'],
                'Employer_Category': ['Private', 'MNC', 'Government'],
                'Education_Level': ['Graduate', 'Graduate', 'Graduate'],
                'Loan_Approved': ['No', 'Yes', 'Yes']
            })
            return
            
        self.raw_df = pd.read_csv(self.dataset_path)

    def _train_model(self):
        df = self.raw_df.copy()
        df = df.drop(columns=['Applicant_ID'], errors='ignore')
        
        num_cols = list(df.select_dtypes(include=['float64']).columns)
        cat_cols = [c for c in df.columns if c not in num_cols and c != 'Loan_Approved']

        for col in num_cols:
            self.defaults[col] = float(df[col].dropna().median()) if not df[col].dropna().empty else 0.0
        for col in cat_cols:
            self.defaults[col] = str(df[col].dropna().mode()[0]) if not df[col].dropna().empty else "Salaried"
        self.defaults['Education_Level'] = str(df['Education_Level'].dropna().mode()[0]) if not df['Education_Level'].dropna().empty else "Graduate"

        self.num_imputer = SimpleImputer(strategy='mean')
        df[num_cols] = self.num_imputer.fit_transform(df[num_cols])
        
        self.cat_imputer = SimpleImputer(strategy='most_frequent')
        df[cat_cols] = self.cat_imputer.fit_transform(df[cat_cols])
        
        self.education_encoder = LabelEncoder()
        df['Education_Level'] = self.education_encoder.fit_transform(df['Education_Level'].astype(str))
        
        le_target = LabelEncoder()
        df['Loan_Approved'] = le_target.fit_transform(df['Loan_Approved'].astype(str))
        
        ohe_cols = ['Employment_Status', 'Marital_Status', 'Loan_Purpose', 'Property_Area', 'Gender', 'Employer_Category']
        self.ohe_encoder = OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore')
        encoded = self.ohe_encoder.fit_transform(df[ohe_cols])
        encoded_df = pd.DataFrame(encoded, columns=self.ohe_encoder.get_feature_names_out(ohe_cols), index=df.index)
        
        df_final = pd.concat([df.drop(columns=ohe_cols), encoded_df], axis=1)
        
        X = df_final.drop('Loan_Approved', axis=1)
        y = df_final['Loan_Approved']
        self.feature_columns = list(X.columns)
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        self.model = RandomForestClassifier(n_estimators=120, max_depth=10, random_state=42)
        self.model.fit(X_train_scaled, y_train)
        
        male_names = ['Arthur White', 'Michael Chang', 'David Miller', 'James Taylor', 'Robert Vance', 'William Davis', 'Joseph Garcia', 'Thomas Martinez']
        female_names = ['Carol Brown', 'Samantha Reed', 'Mary Johnson', 'Patricia Williams', 'Jennifer Jones', 'Linda Davis', 'Elizabeth Wilson', 'Sophia Taylor']

        historical = []
        for idx, row in self.raw_df.iterrows():
            app_id = int(row.get('Applicant_ID', idx + 1)) if pd.notnull(row.get('Applicant_ID')) else (idx + 1)
            gen = str(row['Gender']) if pd.notnull(row['Gender']) else self.defaults['Gender']
            name_list = female_names if str(gen).lower() == 'female' else male_names
            generated_name = f"{name_list[app_id % len(name_list)]}"
            
            target_approved = str(row['Loan_Approved']).strip().title() if pd.notnull(row['Loan_Approved']) else 'No'
            pred = "Approved" if target_approved in ['Yes', 'Approved', '1'] else "Rejected"
            prob = 0.88 if pred == "Approved" else 0.24
            risk = "Low Risk" if prob >= 0.7 else ("Moderate Risk" if prob >= 0.5 else "High Risk")

            historical.append({
                "id": app_id,
                "applicant_name": generated_name,
                "applicant_income": float(row['Applicant_Income']) if pd.notnull(row['Applicant_Income']) else self.defaults['Applicant_Income'],
                "coapplicant_income": float(row['Coapplicant_Income']) if pd.notnull(row['Coapplicant_Income']) else self.defaults['Coapplicant_Income'],
                "age": float(row['Age']) if pd.notnull(row['Age']) else self.defaults['Age'],
                "dependents": float(row['Dependents']) if pd.notnull(row['Dependents']) else self.defaults['Dependents'],
                "credit_score": float(row['Credit_Score']) if pd.notnull(row['Credit_Score']) else self.defaults['Credit_Score'],
                "existing_loans": float(row['Existing_Loans']) if pd.notnull(row['Existing_Loans']) else self.defaults['Existing_Loans'],
                "dti_ratio": float(row['DTI_Ratio']) if pd.notnull(row['DTI_Ratio']) else self.defaults['DTI_Ratio'],
                "savings": float(row['Savings']) if pd.notnull(row['Savings']) else self.defaults['Savings'],
                "collateral_value": float(row['Collateral_Value']) if pd.notnull(row['Collateral_Value']) else self.defaults['Collateral_Value'],
                "loan_amount": float(row['Loan_Amount']) if pd.notnull(row['Loan_Amount']) else self.defaults['Loan_Amount'],
                "loan_term": float(row['Loan_Term']) if pd.notnull(row['Loan_Term']) else self.defaults['Loan_Term'],
                "employment_status": str(row['Employment_Status']) if pd.notnull(row['Employment_Status']) else self.defaults['Employment_Status'],
                "marital_status": str(row['Marital_Status']) if pd.notnull(row['Marital_Status']) else self.defaults['Marital_Status'],
                "loan_purpose": str(row['Loan_Purpose']) if pd.notnull(row['Loan_Purpose']) else self.defaults['Loan_Purpose'],
                "property_area": str(row['Property_Area']) if pd.notnull(row['Property_Area']) else self.defaults['Property_Area'],
                "gender": gen,
                "employer_category": str(row['Employer_Category']) if pd.notnull(row['Employer_Category']) else self.defaults['Employer_Category'],
                "education_level": str(row['Education_Level']) if pd.notnull(row['Education_Level']) else self.defaults['Education_Level'],
                "prediction": pred,
                "approval_probability": prob,
                "risk_level": risk
            })
            
        self.historical_applications = historical

    def predict_and_save(self, input_dict):
        filled_dict = {}
        raw_name = str(input_dict.get('Applicant_Name', '')).strip()
        if not raw_name or raw_name.isdigit():
            applicant_name = 'Applicant'
        else:
            applicant_name = raw_name

        for col in self.num_cols:
            val = input_dict.get(col)
            if val is None or val == '' or (isinstance(val, float) and np.isnan(val)):
                filled_dict[col] = self.defaults[col]
            else:
                try:
                    num_val = float(val)
                    filled_dict[col] = max(0.0, num_val)
                except ValueError:
                    filled_dict[col] = self.defaults[col]

        ohe_cols = ['Employment_Status', 'Marital_Status', 'Loan_Purpose', 'Property_Area', 'Gender', 'Employer_Category']
        for col in ohe_cols:
            val = input_dict.get(col)
            if not val or str(val).strip() == '':
                filled_dict[col] = self.defaults[col]
            else:
                filled_dict[col] = str(val).strip()

        edu_val = input_dict.get('Education_Level')
        if not edu_val or str(edu_val).strip() == '':
            filled_dict['Education_Level'] = self.defaults['Education_Level']
        else:
            filled_dict['Education_Level'] = str(edu_val).strip()

        # Build feature row matching exact feature_columns list
        row_dict = {col: 0.0 for col in self.feature_columns}
        for col in self.num_cols:
            row_dict[col] = filled_dict[col]

        edu_str = str(filled_dict['Education_Level']).lower()
        row_dict['Education_Level'] = 0.0 if ('grad' in edu_str and 'not' not in edu_str) else 1.0

        for cat_col in ohe_cols:
            val = filled_dict[cat_col]
            target_feat = f"{cat_col}_{val}"
            if target_feat in row_dict:
                row_dict[target_feat] = 1.0

        full_df = pd.DataFrame([row_dict])[self.feature_columns]

        scaled_X = self.scaler.transform(full_df)

        prediction_code = self.model.predict(scaled_X)[0]
        prob_scores = self.model.predict_proba(scaled_X)[0]
        approval_prob = float(prob_scores[1]) if len(prob_scores) > 1 else float(prediction_code)

        prediction_status = "Approved" if prediction_code == 1 else "Rejected"
        
        if approval_prob >= 0.75:
            risk_level = "Low Risk"
        elif approval_prob >= 0.50:
            risk_level = "Moderate Risk"
        elif approval_prob >= 0.30:
            risk_level = "High Risk"
        else:
            risk_level = "Critical Risk"

        c_score = filled_dict['Credit_Score']
        dti = filled_dict['DTI_Ratio']
        income = filled_dict['Applicant_Income'] + filled_dict['Coapplicant_Income']
        loan_amt = filled_dict['Loan_Amount']
        monthly_income = income / 12.0 if income > 0 else 1.0
        income_to_loan_ratio = (income / loan_amt) if loan_amt > 0 else 0
        
        insights = []
        if c_score >= 700:
            insights.append("✅ High credit score improves loan approval confidence.")
        elif c_score < 600:
            insights.append("⚠️ Below-average credit score increases perceived risk.")

        if dti <= 0.36:
            insights.append("✅ Healthy Debt-to-Income ratio (≤ 36%).")
        else:
            insights.append("⚠️ High Debt-to-Income ratio (> 36%), indicating existing financial obligations.")

        if filled_dict['Savings'] >= loan_amt * 0.2:
            insights.append("✅ Solid liquid savings buffer available.")
        
        if filled_dict['Collateral_Value'] >= loan_amt:
            insights.append("✅ Collateral value fully backs the requested loan amount.")
        elif filled_dict['Collateral_Value'] == 0:
            insights.append("ℹ️ Unsecured loan request (no collateral provided).")

        new_id = len(self.historical_applications) + len(self.recent_predictions) + 1001
        
        new_record = {
            "id": new_id,
            "applicant_name": applicant_name,
            "applicant_income": filled_dict['Applicant_Income'],
            "coapplicant_income": filled_dict['Coapplicant_Income'],
            "age": filled_dict['Age'],
            "dependents": filled_dict['Dependents'],
            "credit_score": filled_dict['Credit_Score'],
            "existing_loans": filled_dict['Existing_Loans'],
            "dti_ratio": filled_dict['DTI_Ratio'],
            "savings": filled_dict['Savings'],
            "collateral_value": filled_dict['Collateral_Value'],
            "loan_amount": filled_dict['Loan_Amount'],
            "loan_term": filled_dict['Loan_Term'],
            "employment_status": filled_dict['Employment_Status'],
            "marital_status": filled_dict['Marital_Status'],
            "loan_purpose": filled_dict['Loan_Purpose'],
            "property_area": filled_dict['Property_Area'],
            "gender": filled_dict['Gender'],
            "employer_category": filled_dict['Employer_Category'],
            "education_level": filled_dict['Education_Level'],
            "prediction": prediction_status,
            "approval_probability": round(approval_prob, 4),
            "risk_level": risk_level
        }
        
        self.recent_predictions.insert(0, new_record)

        return {
            "id": new_id,
            "applicant_name": applicant_name,
            "prediction": prediction_status,
            "approval_probability": round(approval_prob * 100, 1),
            "risk_level": risk_level,
            "insights": insights,
            "processed_details": filled_dict,
            "metrics": {
                "total_income": income,
                "monthly_income": round(monthly_income, 2),
                "income_to_loan_ratio": round(income_to_loan_ratio, 2),
                "collateral_coverage": round((filled_dict['Collateral_Value'] / loan_amt * 100), 1) if loan_amt > 0 else 0
            }
        }

    def get_applications(self, search="", status_filter="All", limit=2000, sort_order="DESC"):
        all_records = self.recent_predictions + self.historical_applications
        
        filtered = []
        for r in all_records:
            if status_filter in ["Approved", "Rejected"] and r["prediction"] != status_filter:
                continue
            if search:
                s = search.lower()
                name_match = s in str(r.get("applicant_name", "")).lower()
                emp_match = s in str(r.get("employment_status", "")).lower()
                purp_match = s in str(r.get("loan_purpose", "")).lower()
                if not (name_match or emp_match or purp_match):
                    continue
            filtered.append(r)

        if sort_order.upper() == "ASC":
            filtered.sort(key=lambda x: x["id"])
        else:
            filtered.sort(key=lambda x: x["id"], reverse=True)
            
        return filtered[:limit]

    def get_stats(self):
        all_records = self.recent_predictions + self.historical_applications
        total = len(all_records)
        approved = sum(1 for r in all_records if r["prediction"] == "Approved")
        rejected = total - approved
        approval_rate = round((approved / total * 100), 1) if total > 0 else 0.0

        avg_inc = np.mean([r["applicant_income"] for r in all_records]) if total > 0 else 0
        avg_cs = np.mean([r["credit_score"] for r in all_records]) if total > 0 else 0
        avg_loan = np.mean([r["loan_amount"] for r in all_records]) if total > 0 else 0
        avg_dti = np.mean([r["dti_ratio"] for r in all_records]) if total > 0 else 0

        return {
            "total_applications": total,
            "approved_count": approved,
            "rejected_count": rejected,
            "approval_rate": approval_rate,
            "avg_applicant_income": round(float(avg_inc), 2),
            "avg_credit_score": round(float(avg_cs), 1),
            "avg_loan_amount": round(float(avg_loan), 2),
            "avg_dti_ratio": round(float(avg_dti), 2)
        }
