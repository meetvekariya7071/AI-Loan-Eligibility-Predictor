# Loan Approval Prediction

A machine learning project that analyzes loan application data, performs
exploratory data analysis (EDA) and data preprocessing, and trains
multiple classification models to predict whether a loan will be
approved.

## Project Overview

The project follows a typical machine learning workflow:

1.  Load the loan approval dataset
2.  Inspect the dataset and identify missing values
3.  Handle missing numerical and categorical values
4.  Perform exploratory data analysis (EDA)
5.  Remove the applicant ID column
6.  Encode categorical features
7.  Analyze correlations between numerical features
8.  Split the data into training and testing sets
9.  Standardize the features
10. Train classification models
11. Evaluate the models using classification metrics

## Dataset

The notebook expects a CSV file named:

``` text
loan_approval_data.csv
```

The dataset contains information about loan applicants and a target
column:

-   `Loan_Approved` --- target variable indicating whether the loan was
    approved

The notebook works with features such as:

-   `Applicant_Income`
-   `Coapplicant_Income`
-   `Credit_Score`
-   `DTI_Ratio`
-   `Savings`
-   `Education_Level`
-   `Employment_Status`
-   `Marital_Status`
-   `Loan_Purpose`
-   `Property_Area`
-   `Gender`
-   `Employer_Category`

The exact dataset dimensions and values are determined by the supplied
CSV file.

## Exploratory Data Analysis

The project performs several EDA operations to understand the dataset
and identify patterns.

### Loan Approval Distribution

A pie chart is used to visualize the proportion of approved and rejected
loan applications.

### Gender Analysis

A bar plot is used to examine the distribution of applicants by gender.

### Income Distribution

Histograms are created for:

-   Applicant income
-   Co-applicant income

### Outlier Analysis

Box plots are used to inspect numerical variables and compare their
distributions based on loan approval.

The notebook specifically analyzes:

-   Applicant income
-   DTI ratio
-   Credit score
-   Savings

### Approval vs Applicant Income

The distribution of applicant income is compared between approved and
rejected applications.

### Approval vs Credit Score

Credit score distributions are compared according to the loan approval
outcome.

### Correlation Analysis

A correlation heatmap is generated for numerical features to examine
relationships between variables.

## Data Preprocessing

### Missing Values

Missing numerical values are filled using the **mean** strategy.

Missing categorical values are filled using the **most frequent** value.

This is implemented using `SimpleImputer` from scikit-learn.

### Removing Identifier

`Applicant_ID` is removed because it is an identifier rather than a
useful predictive feature.

### Label Encoding

`LabelEncoder` is used for:

-   `Education_Level`
-   `Loan_Approved`

The target variable is converted into numerical form for model training.

### One-Hot Encoding

The following categorical features are one-hot encoded:

-   `Employment_Status`
-   `Marital_Status`
-   `Loan_Purpose`
-   `Property_Area`
-   `Gender`
-   `Employer_Category`

The encoder uses:

-   `drop="first"` to avoid redundant dummy variables
-   `handle_unknown="ignore"` to handle unseen categories

## Model Training

The target variable is:

``` text
Loan_Approved
```

The remaining columns are used as input features.

The dataset is divided using an 80/20 train-test split:

-   80% --- training data
-   20% --- testing data

`random_state=42` is used for reproducibility.

### Feature Scaling

`StandardScaler` is applied to the training and testing features.

The scaler is fitted only on the training data and then used to
transform both training and testing data.

## Machine Learning Models

The project trains the following classification algorithms:

### 1. Logistic Regression

A linear classification model used as a baseline for predicting loan
approval.

### 2. K-Nearest Neighbors (KNN)

A distance-based classification algorithm.

The notebook uses:

``` python
n_neighbors = 7
```

### 3. Gaussian Naive Bayes

A probabilistic classification algorithm based on Bayes' theorem with
the Gaussian assumption for numerical features.

### 4. Decision Tree

A tree-based classification algorithm used to model decision rules from
the input features.

## Model Evaluation

Each model is evaluated using:

-   **Accuracy** --- proportion of correct predictions
-   **Precision** --- proportion of predicted approvals that were
    actually approvals
-   **Recall** --- proportion of actual approvals that were correctly
    identified
-   **F1 Score** --- harmonic mean of precision and recall
-   **Confusion Matrix** --- shows the counts of correct and incorrect
    predictions for each class

The notebook prints these metrics for each model.

## Technologies Used

-   Python
-   Pandas
-   NumPy
-   Matplotlib
-   Seaborn
-   Scikit-learn
-   Jupyter Notebook

## Python Libraries

``` text
pandas
numpy
matplotlib
seaborn
scikit-learn
```

## Project Structure

``` text
Loan-Approval-Prediction/
│
├── Main.ipynb
├── loan_approval_data.csv
├── README.md
└── ...
```

## How to Run

### 1. Clone the repository

``` bash
git clone <your-repository-url>
cd <your-project-folder>
```

### 2. Install dependencies

``` bash
pip install pandas numpy matplotlib seaborn scikit-learn jupyter
```

### 3. Add the dataset

Place the dataset in the project directory:

``` text
loan_approval_data.csv
```

### 4. Start Jupyter Notebook

``` bash
jupyter notebook
```

Open:

``` text
Main.ipynb
```

and run the notebook cells in order.

## Machine Learning Workflow

``` text
Loan Dataset
     │
     ▼
Data Loading
     │
     ▼
Data Inspection
     │
     ▼
Missing Value Handling
     │
     ▼
EDA & Visualization
     │
     ▼
Feature Selection
     │
     ▼
Categorical Encoding
     │
     ▼
Train/Test Split
     │
     ▼
Feature Scaling
     │
     ▼
Model Training
     │
     ├── Logistic Regression
     ├── KNN
     ├── Gaussian Naive Bayes
     └── Decision Tree
     │
     ▼
Model Evaluation
     │
     ├── Accuracy
     ├── Precision
     ├── Recall
     ├── F1 Score
     └── Confusion Matrix
```

## Key Learning Outcomes

This project demonstrates practical implementation of:

-   Data loading and inspection
-   Missing-value treatment
-   Exploratory data analysis
-   Data visualization
-   Outlier analysis
-   Correlation analysis
-   Label encoding
-   One-hot encoding
-   Train-test splitting
-   Feature scaling
-   Classification algorithms
-   Model evaluation

## Future Improvements

Possible improvements include:

-   Compare model performance in a single table
-   Tune hyperparameters using GridSearchCV or RandomizedSearchCV
-   Handle class imbalance if present in the dataset
-   Perform cross-validation
-   Investigate feature importance
-   Improve the Decision Tree evaluation
-   Build a prediction interface using Streamlit
-   Save the trained model using `joblib` or `pickle`
-   Create a complete deployment pipeline

## Note

The notebook currently contains the complete data preprocessing, EDA,
training, and evaluation workflow. Model performance depends on the
contents of `loan_approval_data.csv`.

For the Decision Tree section, verify that predictions are generated
using the trained Decision Tree model before interpreting its evaluation
metrics.
