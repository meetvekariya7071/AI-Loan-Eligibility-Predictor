export function runClientSidePrediction(inputDict, defaults = {}) {
  const numDefaults = {
    Applicant_Income: 12000,
    Coapplicant_Income: 0,
    Age: 35,
    Dependents: 1,
    Credit_Score: 680,
    Existing_Loans: 1,
    DTI_Ratio: 0.35,
    Savings: 10000,
    Collateral_Value: 15000,
    Loan_Amount: 15000,
    Loan_Term: 36,
    ...defaults
  };

  const income = Number(inputDict.Applicant_Income || numDefaults.Applicant_Income) + Number(inputDict.Coapplicant_Income || numDefaults.Coapplicant_Income);
  const creditScore = Number(inputDict.Credit_Score || numDefaults.Credit_Score);
  const dti = Number(inputDict.DTI_Ratio || numDefaults.DTI_Ratio);
  const loanAmt = Number(inputDict.Loan_Amount || numDefaults.Loan_Amount);
  const savings = Number(inputDict.Savings || numDefaults.Savings);
  const collateral = Number(inputDict.Collateral_Value || numDefaults.Collateral_Value);
  const empStatus = String(inputDict.Employment_Status || 'Salaried');
  const applicantName = String(inputDict.Applicant_Name || 'Applicant').trim() || 'Applicant';

  let score = 50.0;
  
  if (creditScore >= 750) score += 25;
  else if (creditScore >= 680) score += 15;
  else if (creditScore >= 600) score += 5;
  else score -= 35;

  if (dti <= 0.28) score += 15;
  else if (dti <= 0.38) score += 8;
  else if (dti > 0.50) score -= 25;

  if (income > 0 && (loanAmt / income) <= 2.5) score += 12;
  else if (income > 0 && (loanAmt / income) > 4.5) score -= 20;

  if (savings >= loanAmt * 0.3) score += 10;
  else if (savings >= loanAmt * 0.1) score += 5;

  if (collateral >= loanAmt) score += 10;
  else if (collateral === 0) score -= 5;

  if (empStatus === 'Salaried' || empStatus === 'MNC') score += 5;
  else if (empStatus === 'Unemployed') score -= 30;

  let probability = Math.min(96.0, Math.max(0.0, Math.round(score * 10) / 10));
  if (creditScore < 550 && empStatus === 'Unemployed') {
    probability = 0.0;
  }

  const isApproved = probability >= 50.0;
  const prediction = isApproved ? 'Approved' : 'Rejected';

  let riskLevel = 'Moderate Risk';
  if (probability >= 75) riskLevel = 'Low Risk';
  else if (probability >= 50) riskLevel = 'Moderate Risk';
  else if (probability >= 30) riskLevel = 'High Risk';
  else riskLevel = 'Critical Risk';

  const insights = [];
  if (creditScore >= 700) insights.push('✅ High credit score improves loan approval confidence.');
  else if (creditScore < 600) insights.push('⚠️ Below-average credit score increases perceived risk.');

  if (dti <= 0.36) insights.push('✅ Healthy Debt-to-Income ratio (≤ 36%).');
  else insights.push('⚠️ High Debt-to-Income ratio (> 36%), indicating existing financial obligations.');

  if (savings >= loanAmt * 0.2) insights.push('✅ Solid liquid savings buffer available.');
  if (collateral >= loanAmt) insights.push('✅ Collateral value fully backs the requested loan amount.');
  else if (collateral === 0) insights.push('ℹ️ Unsecured loan request (no collateral provided).');

  const monthlyIncome = income > 0 ? income / 12.0 : 1.0;
  const incomeToLoanRatio = loanAmt > 0 ? income / loanAmt : 0;
  const collateralCoverage = loanAmt > 0 ? (collateral / loanAmt) * 100 : 0;

  return {
    id: Math.floor(Math.random() * 90000) + 10000,
    applicant_name: applicantName,
    prediction,
    approval_probability: probability,
    risk_level: riskLevel,
    insights,
    processed_details: {
      Applicant_Income: Number(inputDict.Applicant_Income || numDefaults.Applicant_Income),
      Coapplicant_Income: Number(inputDict.Coapplicant_Income || numDefaults.Coapplicant_Income),
      Credit_Score: creditScore,
      DTI_Ratio: dti,
      Loan_Amount: loanAmt,
      Savings: savings,
      Collateral_Value: collateral,
      Employment_Status: empStatus
    },
    metrics: {
      total_income: income,
      monthly_income: Math.round(monthlyIncome * 100) / 100,
      income_to_loan_ratio: Math.round(incomeToLoanRatio * 100) / 100,
      collateral_coverage: Math.round(collateralCoverage * 10) / 10
    }
  };
}
