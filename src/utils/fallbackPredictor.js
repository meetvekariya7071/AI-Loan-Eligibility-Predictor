export function runClientSidePrediction(inputDict, defaults = {}) {
  const numDefaults = {
    Applicant_Income: 10852.57,
    Coapplicant_Income: 5082.46,
    Age: 39.97,
    Dependents: 1.47,
    Credit_Score: 676.03,
    Existing_Loans: 1.95,
    DTI_Ratio: 0.347,
    Savings: 9940.45,
    Collateral_Value: 24802.79,
    Loan_Amount: 20522.82,
    Loan_Term: 48.0,
    ...defaults
  };

  const getNonNegative = (val, fallback) => {
    const n = Number(val ?? fallback);
    return isNaN(n) ? fallback : Math.max(0, n);
  };

  const inc = getNonNegative(inputDict.Applicant_Income, numDefaults.Applicant_Income);
  const co_inc = getNonNegative(inputDict.Coapplicant_Income, numDefaults.Coapplicant_Income);
  const cs = getNonNegative(inputDict.Credit_Score, numDefaults.Credit_Score);
  const dti = getNonNegative(inputDict.DTI_Ratio, numDefaults.DTI_Ratio);
  const savings = getNonNegative(inputDict.Savings, numDefaults.Savings);
  const collateral = getNonNegative(inputDict.Collateral_Value, numDefaults.Collateral_Value);
  const loanAmt = getNonNegative(inputDict.Loan_Amount, numDefaults.Loan_Amount);
  const empStatus = String(inputDict.Employment_Status || 'Salaried');

  let applicantName = String(inputDict.Applicant_Name || 'Applicant').trim();
  if (!applicantName || /^\d+$/.test(applicantName)) {
    applicantName = 'Applicant';
  }

  // Standardized Z-Score scaling based on notebook training dataset parameters
  const z_cs = (cs - 676.03) / 69.50;
  const z_dti = (dti - 0.347) / 0.1406;
  const z_inc = (inc - 10852.57) / 4930.87;
  const z_loan = (loanAmt - 20522.82) / 11206.95;
  const z_sav = (savings - 9940.45) / 5709.33;
  const z_col = (collateral - 24802.79) / 13975.09;

  let logit = 0.85 + (0.75 * z_cs) - (0.85 * z_dti) + (0.22 * z_inc) - (0.18 * z_loan) + (0.15 * z_sav) + (0.15 * z_col);
  if (empStatus === 'Unemployed') {
    logit -= 1.8;
  }

  const prob = 1.0 / (1.0 + Math.exp(-logit));
  let probability = Math.min(99.0, Math.max(0.0, Math.round(prob * 1000) / 10));

  if (cs < 530 && empStatus === 'Unemployed') {
    probability = 2.5;
  }

  const isApproved = probability >= 50.0;
  const prediction = isApproved ? 'Approved' : 'Rejected';

  let riskLevel = 'Moderate Risk';
  if (probability >= 75) riskLevel = 'Low Risk';
  else if (probability >= 50) riskLevel = 'Moderate Risk';
  else if (probability >= 30) riskLevel = 'High Risk';
  else riskLevel = 'Critical Risk';

  const insights = [];
  if (inputDict.Credit_Score !== undefined && inputDict.Credit_Score !== '') {
    if (cs >= 700) insights.push('✅ High credit score improves loan approval confidence.');
    else if (cs < 600) insights.push('⚠️ Below-average credit score increases perceived risk.');
  }

  if (inputDict.DTI_Ratio !== undefined && inputDict.DTI_Ratio !== '') {
    if (dti <= 0.36) insights.push('✅ Healthy Debt-to-Income ratio (≤ 36%).');
    else insights.push('⚠️ High Debt-to-Income ratio (> 36%), indicating existing financial obligations.');
  }

  if (inputDict.Savings !== undefined && inputDict.Savings !== '') {
    if (savings >= loanAmt * 0.2) insights.push('✅ Solid liquid savings buffer available.');
  }
  if (inputDict.Collateral_Value !== undefined && inputDict.Collateral_Value !== '') {
    if (collateral >= loanAmt) insights.push('✅ Collateral value fully backs the requested loan amount.');
    else if (collateral === 0) insights.push('ℹ️ Unsecured loan request (no collateral provided).');
  }

  const totalIncome = inc + co_inc;
  const monthlyIncome = totalIncome > 0 ? totalIncome / 12.0 : 1.0;
  const incomeToLoanRatio = loanAmt > 0 ? totalIncome / loanAmt : 0;
  const collateralCoverage = loanAmt > 0 ? (collateral / loanAmt) * 100 : 0;

  const userProvidedDetails = {};
  Object.keys(inputDict).forEach(key => {
    if (inputDict[key] !== undefined && inputDict[key] !== null && String(inputDict[key]).trim() !== '') {
      userProvidedDetails[key] = inputDict[key];
    }
  });

  return {
    id: Math.floor(Math.random() * 90000) + 10000,
    applicant_name: applicantName,
    prediction,
    approval_probability: probability,
    risk_level: riskLevel,
    insights,
    processed_details: userProvidedDetails,
    metrics: {
      total_income: totalIncome,
      monthly_income: Math.round(monthlyIncome * 100) / 100,
      income_to_loan_ratio: Math.round(incomeToLoanRatio * 100) / 100,
      collateral_coverage: Math.round(collateralCoverage * 10) / 10
    }
  };
}
