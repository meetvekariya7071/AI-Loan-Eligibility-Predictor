import os
import sqlite3
import pandas as pd
import numpy as np
import pymongo
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier

# Path to original training dataset (do not modify Modal train folder!)
DATASET_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Modal train", "loan_approval_data.csv"))
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "loan_applications.db"))

class LoanPredictorModel:
    def __init__(self):
        self.num_cols = ['Applicant_Income', 'Coapplicant_Income', 'Age', 'Dependents', 
                         'Credit_Score', 'Existing_Loans', 'DTI_Ratio', 'Savings', 
                         'Collateral_Value', 'Loan_Amount', 'Loan_Term']
        self.cat_cols = ['Employment_Status', 'Marital_Status', 'Loan_Purpose', 
                         'Property_Area', 'Gender', 'Employer_Category']
        
        self.num_imputer = None
        self.cat_imputer = None
        self.education_encoder = None
        self.ohe_encoder = None
        self.scaler = None
        self.model = None
        self.feature_columns = None
        self.defaults = {}
        
        # MongoDB Connection attributes
        self.mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/loan_approval_db")
        self.mongo_client = None
        self.mongo_db = None
        self.mongo_collection = None
        self.mongo_connected = False
        self.mongo_error = None
        
        self._train_and_initialize()
        self._init_database()
        
        # Try auto-connecting to local MongoDB if available
        self.connect_mongodb(self.mongo_uri, auto_sync=False)

    def _train_and_initialize(self):
        if not os.path.exists(DATASET_PATH):
            raise FileNotFoundError(f"Training dataset not found at {DATASET_PATH}")
            
        raw_df = pd.read_csv(DATASET_PATH)
        df = raw_df.copy()
        
        # Store dataset defaults (medians for num, mode for cat) for front-end fallback
        for col in self.num_cols:
            self.defaults[col] = float(df[col].dropna().median()) if not df[col].dropna().empty else 0.0
        for col in self.cat_cols:
            self.defaults[col] = str(df[col].dropna().mode()[0]) if not df[col].dropna().empty else "Salaried"
        self.defaults['Education_Level'] = str(df['Education_Level'].dropna().mode()[0]) if not df['Education_Level'].dropna().empty else "Graduate"

        # Imputers
        self.num_imputer = SimpleImputer(strategy='mean')
        df[self.num_cols] = self.num_imputer.fit_transform(df[self.num_cols])
        
        self.cat_imputer = SimpleImputer(strategy='most_frequent')
        df[self.cat_cols] = self.cat_imputer.fit_transform(df[self.cat_cols])
        
        # Education Level Label Encoding
        self.education_encoder = LabelEncoder()
        df['Education_Level'] = self.education_encoder.fit_transform(df['Education_Level'].astype(str))
        
        # Target Encoding
        df['Loan_Approved_Code'] = df['Loan_Approved'].apply(lambda x: 1 if str(x).strip().lower() in ['yes', '1', 'approved'] else 0)
        
        # Drop identifier
        if 'Applicant_ID' in df.columns:
            df = df.drop(columns=['Applicant_ID'])
            
        # One Hot Encoding for nominal categoricals
        self.ohe_encoder = OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore')
        encoded_cat = self.ohe_encoder.fit_transform(df[self.cat_cols])
        encoded_cat_df = pd.DataFrame(encoded_cat, columns=self.ohe_encoder.get_feature_names_out(self.cat_cols), index=df.index)
        
        # Combine numerical, encoded education, and one-hot encoded columns
        X = pd.concat([df[self.num_cols], df[['Education_Level']], encoded_cat_df], axis=1)
        y = df['Loan_Approved_Code']
        
        self.feature_columns = list(X.columns)
        
        # Train split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        # Train Random Forest Classifier
        self.model = RandomForestClassifier(n_estimators=120, max_depth=12, random_state=42)
        self.model.fit(X_train_scaled, y_train)
        
        print(f"[ML Engine] Model trained successfully on {len(df)} records with {len(self.feature_columns)} features.")

    def _init_database(self):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS loan_applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                applicant_name TEXT,
                applicant_income REAL,
                coapplicant_income REAL,
                age REAL,
                dependents REAL,
                credit_score REAL,
                existing_loans REAL,
                dti_ratio REAL,
                savings REAL,
                collateral_value REAL,
                loan_amount REAL,
                loan_term REAL,
                employment_status TEXT,
                marital_status TEXT,
                loan_purpose TEXT,
                property_area TEXT,
                gender TEXT,
                employer_category TEXT,
                education_level TEXT,
                prediction TEXT,
                approval_probability REAL,
                risk_level TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        
        cursor.execute('SELECT COUNT(*) FROM loan_applications')
        count = cursor.fetchone()[0]
        
        # If SQLite table doesn't have ALL dataset rows (less than 1000), seed ALL dataset rows!
        if count < 1000 and os.path.exists(DATASET_PATH):
            cursor.execute('DELETE FROM loan_applications') # Clean reset to seed full dataset cleanly
            raw_df = pd.read_csv(DATASET_PATH) # All 1000 rows from training dataset
            for idx, row in raw_df.iterrows():
                app_income = float(row['Applicant_Income']) if pd.notnull(row['Applicant_Income']) else self.defaults['Applicant_Income']
                co_income = float(row['Coapplicant_Income']) if pd.notnull(row['Coapplicant_Income']) else self.defaults['Coapplicant_Income']
                age = float(row['Age']) if pd.notnull(row['Age']) else self.defaults['Age']
                deps = float(row['Dependents']) if pd.notnull(row['Dependents']) else self.defaults['Dependents']
                c_score = float(row['Credit_Score']) if pd.notnull(row['Credit_Score']) else self.defaults['Credit_Score']
                ex_loans = float(row['Existing_Loans']) if pd.notnull(row['Existing_Loans']) else self.defaults['Existing_Loans']
                dti = float(row['DTI_Ratio']) if pd.notnull(row['DTI_Ratio']) else self.defaults['DTI_Ratio']
                savings = float(row['Savings']) if pd.notnull(row['Savings']) else self.defaults['Savings']
                collateral = float(row['Collateral_Value']) if pd.notnull(row['Collateral_Value']) else self.defaults['Collateral_Value']
                amount = float(row['Loan_Amount']) if pd.notnull(row['Loan_Amount']) else self.defaults['Loan_Amount']
                term = float(row['Loan_Term']) if pd.notnull(row['Loan_Term']) else self.defaults['Loan_Term']
                
                emp = str(row['Employment_Status']) if pd.notnull(row['Employment_Status']) else self.defaults['Employment_Status']
                mar = str(row['Marital_Status']) if pd.notnull(row['Marital_Status']) else self.defaults['Marital_Status']
                purp = str(row['Loan_Purpose']) if pd.notnull(row['Loan_Purpose']) else self.defaults['Loan_Purpose']
                prop = str(row['Property_Area']) if pd.notnull(row['Property_Area']) else self.defaults['Property_Area']
                gen = str(row['Gender']) if pd.notnull(row['Gender']) else self.defaults['Gender']
                emp_cat = str(row['Employer_Category']) if pd.notnull(row['Employer_Category']) else self.defaults['Employer_Category']
                edu = str(row['Education_Level']) if pd.notnull(row['Education_Level']) else self.defaults['Education_Level']
                
                target_approved = str(row['Loan_Approved']).strip().title() if pd.notnull(row['Loan_Approved']) else 'No'
                pred = "Approved" if target_approved in ['Yes', 'Approved', '1'] else "Rejected"
                prob = 0.88 if pred == "Approved" else 0.24
                risk = "Low Risk" if prob >= 0.7 else ("Moderate Risk" if prob >= 0.5 else "High Risk")
                
                app_id_val = row.get('Applicant_ID')
                app_id_num = int(app_id_val) if pd.notnull(app_id_val) else (idx + 1)
                
                # Generate realistic applicant name based on gender and ID
                male_names = ['Arthur White', 'Michael Chang', 'David Miller', 'James Taylor', 'Robert Vance', 'William Davis', 'Joseph Garcia', 'Thomas Martinez']
                female_names = ['Carol Brown', 'Samantha Reed', 'Mary Johnson', 'Patricia Williams', 'Jennifer Jones', 'Linda Davis', 'Elizabeth Wilson', 'Sophia Taylor']
                name_list = female_names if gen.lower() == 'female' else male_names
                generated_name = f"{name_list[app_id_num % len(name_list)]}"

                cursor.execute('''
                    INSERT INTO loan_applications (
                        applicant_name, applicant_income, coapplicant_income, age, dependents,
                        credit_score, existing_loans, dti_ratio, savings, collateral_value,
                        loan_amount, loan_term, employment_status, marital_status, loan_purpose,
                        property_area, gender, employer_category, education_level, prediction,
                        approval_probability, risk_level
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    generated_name, app_income, co_income, age, deps,
                    c_score, ex_loans, dti, savings, collateral,
                    amount, term, emp, mar, purp,
                    prop, gen, emp_cat, edu, pred,
                    prob, risk
                ))
            conn.commit()
            print(f"[DB] Initialized database and seeded ALL {len(raw_df)} historical training dataset records into SQLite.")
        conn.close()

    def connect_mongodb(self, uri, auto_sync=True):
        """
        Connects to MongoDB using specified URI string.
        URI examples:
          - Local: mongodb://localhost:27017/
          - MongoDB Atlas Cloud: mongodb+srv://<username>:<password>@cluster0.mongodb.net/loan_db?retryWrites=true&w=majority
        """
        try:
            self.mongo_uri = uri
            client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=3000)
            # Ping database to test connection
            client.admin.command('ping')
            
            self.mongo_client = client
            self.mongo_db = client['loan_approval_db']
            self.mongo_collection = self.mongo_db['loan_applications']
            self.mongo_connected = True
            self.mongo_error = None
            
            print(f"[MongoDB] Successfully connected to MongoDB at {uri[:35]}...")
            
            if auto_sync:
                self.sync_all_to_mongodb()
                
            return {
                "success": True,
                "message": "Connected to MongoDB successfully",
                "uri": uri,
                "collection_count": self.mongo_collection.count_documents({})
            }
        except Exception as e:
            self.mongo_connected = False
            self.mongo_error = str(e)
            print(f"[MongoDB] Connection failed: {e}")
            return {
                "success": False,
                "message": f"MongoDB Connection Failed: {str(e)}",
                "uri": uri
            }

    def sync_all_to_mongodb(self):
        """
        Syncs all records from SQLite database to MongoDB collection.
        """
        if not self.mongo_connected or self.mongo_collection is None:
            return 0

        sqlite_apps = self.get_applications(limit=2000)
        inserted_count = 0
        
        for app in sqlite_apps:
            # Upsert into MongoDB by app id
            app_id = app['id']
            mongo_doc = {**app}
            self.mongo_collection.update_one(
                {"id": app_id},
                {"$set": mongo_doc},
                upsert=True
            )
            inserted_count += 1
            
        print(f"[MongoDB] Synced {inserted_count} records to MongoDB collection 'loan_applications'.")
        return inserted_count

    def get_mongodb_status(self):
        return {
            "connected": self.mongo_connected,
            "uri": self.mongo_uri,
            "database": "loan_approval_db",
            "collection": "loan_applications",
            "count": self.mongo_collection.count_documents({}) if self.mongo_connected else 0,
            "error": self.mongo_error
        }

    def predict_and_save(self, input_dict):
        """
        Takes input_dict containing full or partial applicant details.
        Imputes missing values with smart defaults, formats features, runs ML prediction,
        saves to SQLite database & MongoDB (if connected), and returns prediction breakdown.
        """
        filled_dict = {}
        applicant_name = str(input_dict.get('Applicant_Name', '')).strip() or 'Applicant'

        # Numerical fields
        for col in self.num_cols:
            val = input_dict.get(col)
            if val is None or val == '' or (isinstance(val, float) and np.isnan(val)):
                filled_dict[col] = self.defaults[col]
            else:
                try:
                    filled_dict[col] = float(val)
                except ValueError:
                    filled_dict[col] = self.defaults[col]

        # Categorical fields
        for col in self.cat_cols:
            val = input_dict.get(col)
            if not val or str(val).strip() == '':
                filled_dict[col] = self.defaults[col]
            else:
                filled_dict[col] = str(val)

        # Education level
        edu_val = input_dict.get('Education_Level')
        if not edu_val or str(edu_val).strip() == '':
            filled_dict['Education_Level'] = self.defaults['Education_Level']
        else:
            filled_dict['Education_Level'] = str(edu_val)

        # Step 2: Transform into ML feature vector
        num_df = pd.DataFrame([filled_dict])[self.num_cols]
        num_df_imputed = pd.DataFrame(self.num_imputer.transform(num_df), columns=self.num_cols)

        # Education encoding
        edu_str = filled_dict['Education_Level'].lower()
        edu_encoded_val = 1 if 'grad' in edu_str and 'not' not in edu_str else 0

        # One Hot Encoding
        cat_df = pd.DataFrame([filled_dict])[self.cat_cols]
        cat_df_imputed = pd.DataFrame(self.cat_imputer.transform(cat_df), columns=self.cat_cols)
        ohe_features = self.ohe_encoder.transform(cat_df_imputed)
        ohe_df = pd.DataFrame(ohe_features, columns=self.ohe_encoder.get_feature_names_out(self.cat_cols))

        # Full feature frame
        full_df = pd.concat([num_df_imputed, pd.DataFrame([{'Education_Level': edu_encoded_val}]), ohe_df], axis=1)
        full_df = full_df[self.feature_columns]

        # Scale features
        scaled_X = self.scaler.transform(full_df)

        # Step 3: Model Prediction
        prediction_code = self.model.predict(scaled_X)[0]
        prob_scores = self.model.predict_proba(scaled_X)[0]
        approval_prob = float(prob_scores[1]) # probability of class 1 (Approved)

        prediction_status = "Approved" if prediction_code == 1 else "Rejected"
        
        # Risk assessment
        if approval_prob >= 0.75:
            risk_level = "Low Risk"
        elif approval_prob >= 0.50:
            risk_level = "Moderate Risk"
        elif approval_prob >= 0.30:
            risk_level = "High Risk"
        else:
            risk_level = "Critical Risk"

        # Key insights
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

        # Step 4: Save application to SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO loan_applications (
                applicant_name, applicant_income, coapplicant_income, age, dependents,
                credit_score, existing_loans, dti_ratio, savings, collateral_value,
                loan_amount, loan_term, employment_status, marital_status, loan_purpose,
                property_area, gender, employer_category, education_level, prediction,
                approval_probability, risk_level
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            applicant_name, filled_dict['Applicant_Income'], filled_dict['Coapplicant_Income'],
            filled_dict['Age'], filled_dict['Dependents'], filled_dict['Credit_Score'],
            filled_dict['Existing_Loans'], filled_dict['DTI_Ratio'], filled_dict['Savings'],
            filled_dict['Collateral_Value'], filled_dict['Loan_Amount'], filled_dict['Loan_Term'],
            filled_dict['Employment_Status'], filled_dict['Marital_Status'], filled_dict['Loan_Purpose'],
            filled_dict['Property_Area'], filled_dict['Gender'], filled_dict['Employer_Category'],
            filled_dict['Education_Level'], prediction_status, round(approval_prob, 4), risk_level
        ))
        application_id = cursor.lastrowid
        conn.commit()
        conn.close()

        record_data = {
            "id": application_id,
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

        # Ensure MongoDB is connected
        if not self.mongo_connected:
            self.connect_mongodb(self.mongo_uri, auto_sync=False)

        # Save/Upsert to MongoDB if connected
        if self.mongo_connected and self.mongo_collection is not None:
            try:
                self.mongo_collection.update_one(
                    {"id": application_id},
                    {"$set": record_data.copy()},
                    upsert=True
                )
                print(f"[MongoDB] Application #{application_id} ({applicant_name}) synced & saved to MongoDB collection.")
            except Exception as mongo_err:
                print(f"[MongoDB] Sync/Insert error: {mongo_err}")

        # Sync any other missing SQLite records to MongoDB
        if self.mongo_connected:
            self.sync_all_to_mongodb()

        return {
            "id": application_id,
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
            },
            "mongo_saved": self.mongo_connected
        }

    def get_applications(self, search="", status_filter="All", limit=2000, sort_order="ASC"):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = "SELECT * FROM loan_applications WHERE 1=1"
        params = []
        
        if search:
            query += " AND (applicant_name LIKE ? OR employment_status LIKE ? OR loan_purpose LIKE ?)"
            s = f"%{search}%"
            params.extend([s, s, s])
            
        if status_filter in ["Approved", "Rejected"]:
            query += " AND prediction = ?"
            params.append(status_filter)
            
        order = "ASC" if str(sort_order).upper() == "ASC" else "DESC"
        query += f" ORDER BY id {order} LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        result = [dict(row) for row in rows]
        conn.close()
        return result

    def get_stats(self):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*), SUM(CASE WHEN prediction='Approved' THEN 1 ELSE 0 END) FROM loan_applications")
        total, approved = cursor.fetchone()
        approved = approved or 0
        rejected = total - (approved or 0)
        approval_rate = round((approved / total * 100), 1) if total and total > 0 else 0.0
        
        cursor.execute("SELECT AVG(applicant_income), AVG(credit_score), AVG(loan_amount), AVG(dti_ratio) FROM loan_applications")
        avg_inc, avg_cs, avg_loan, avg_dti = cursor.fetchone()
        
        conn.close()
        return {
            "total_applications": total or 0,
            "approved_count": approved,
            "rejected_count": rejected,
            "approval_rate": approval_rate,
            "avg_applicant_income": round(avg_inc or 0, 2),
            "avg_credit_score": round(avg_cs or 0, 1),
            "avg_loan_amount": round(avg_loan or 0, 2),
            "avg_dti_ratio": round(avg_dti or 0, 2),
            "mongo": self.get_mongodb_status()
        }
