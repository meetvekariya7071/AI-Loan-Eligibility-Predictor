import React, { useState } from 'react';
import { 
  Zap, FileText, User, DollarSign, CreditCard, Home, Briefcase, 
  Sparkles, RotateCcw, AlertCircle, HelpCircle, CheckCircle2 
} from 'lucide-react';

const DEFAULT_PRESETS = [
  {
    name: "High Approval Candidate",
    description: "High credit score, steady salaried income, low DTI, high savings.",
    data: {
      Applicant_Name: "Robert Vance",
      Applicant_Income: 18500,
      Coapplicant_Income: 4500,
      Age: 38,
      Dependents: 1,
      Credit_Score: 760,
      Existing_Loans: 1,
      DTI_Ratio: 0.22,
      Savings: 28000,
      Collateral_Value: 45000,
      Loan_Amount: 25000,
      Loan_Term: 36,
      Employment_Status: "Salaried",
      Marital_Status: "Married",
      Loan_Purpose: "Home",
      Property_Area: "Urban",
      Gender: "Male",
      Employer_Category: "MNC",
      Education_Level: "Graduate"
    }
  },
  {
    name: "Quick Fill (Essential Only)",
    description: "Only 5 key fields provided! Omitted optional fields remain empty.",
    data: {
      Applicant_Name: "Sophia Taylor",
      Applicant_Income: 12000,
      Credit_Score: 710,
      Loan_Amount: 15000,
      Loan_Term: 24,
      Employment_Status: "Salaried"
    }
  },
  {
    name: "High Risk Candidate",
    description: "Low credit score, high existing debt ratio, zero savings.",
    data: {
      Applicant_Name: "James Miller",
      Applicant_Income: 4500,
      Coapplicant_Income: 0,
      Age: 24,
      Dependents: 3,
      Credit_Score: 510,
      Existing_Loans: 4,
      DTI_Ratio: 0.65,
      Savings: 500,
      Collateral_Value: 0,
      Loan_Amount: 35000,
      Loan_Term: 72,
      Employment_Status: "Unemployed",
      Marital_Status: "Single",
      Loan_Purpose: "Personal",
      Property_Area: "Rural",
      Gender: "Male",
      Employer_Category: "Unemployed",
      Education_Level: "Not Graduate"
    }
  },
  {
    name: "Self-Employed Entrepreneur",
    description: "Moderate income, substantial collateral, average credit score.",
    data: {
      Applicant_Name: "Elena Rostova",
      Applicant_Income: 14000,
      Coapplicant_Income: 2500,
      Age: 32,
      Dependents: 0,
      Credit_Score: 665,
      Existing_Loans: 2,
      DTI_Ratio: 0.38,
      Savings: 12500,
      Collateral_Value: 38000,
      Loan_Amount: 20000,
      Loan_Term: 48,
      Employment_Status: "Self-employed",
      Marital_Status: "Single",
      Loan_Purpose: "Business",
      Property_Area: "Semiurban",
      Gender: "Female",
      Employer_Category: "Self-employed",
      Education_Level: "Graduate"
    }
  }
];

export default function LoanForm({ onSubmit, loading, presets = [], defaults }) {
  const [mode, setMode] = useState('quick'); // 'quick' or 'full'
  const [validationError, setValidationError] = useState('');
  const [formData, setFormData] = useState({
    Applicant_Name: '',
    Applicant_Income: '',
    Coapplicant_Income: '',
    Age: '',
    Dependents: '',
    Credit_Score: '',
    Existing_Loans: '',
    DTI_Ratio: '',
    Savings: '',
    Collateral_Value: '',
    Loan_Amount: '',
    Loan_Term: '36',
    Employment_Status: 'Salaried',
    Marital_Status: '',
    Loan_Purpose: '',
    Property_Area: '',
    Gender: '',
    Employer_Category: '',
    Education_Level: ''
  });

  const activePresets = presets && presets.length > 0 ? presets : DEFAULT_PRESETS;

  const preventNegativeKeys = (e) => {
    if (['-', 'e', 'E', '+'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (field, value) => {
    setValidationError('');
    const numFields = ['Applicant_Income', 'Coapplicant_Income', 'Age', 'Dependents', 'Credit_Score', 'Existing_Loans', 'DTI_Ratio', 'Savings', 'Collateral_Value', 'Loan_Amount'];
    if (numFields.includes(field) && typeof value === 'string') {
      value = value.replace(/-/g, '');
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyPreset = (presetData) => {
    setValidationError('');
    setFormData({
      Applicant_Name: '',
      Applicant_Income: '',
      Coapplicant_Income: '',
      Age: '',
      Dependents: '',
      Credit_Score: '',
      Existing_Loans: '',
      DTI_Ratio: '',
      Savings: '',
      Collateral_Value: '',
      Loan_Amount: '',
      Loan_Term: '36',
      Employment_Status: 'Salaried',
      Marital_Status: '',
      Loan_Purpose: '',
      Property_Area: '',
      Gender: '',
      Employer_Category: '',
      Education_Level: '',
      ...presetData
    });
  };

  const handleClear = () => {
    setValidationError('');
    setFormData({
      Applicant_Name: '',
      Applicant_Income: '',
      Coapplicant_Income: '',
      Age: '',
      Dependents: '',
      Credit_Score: '',
      Existing_Loans: '',
      DTI_Ratio: '',
      Savings: '',
      Collateral_Value: '',
      Loan_Amount: '',
      Loan_Term: '36',
      Employment_Status: 'Salaried',
      Marital_Status: '',
      Loan_Purpose: '',
      Property_Area: '',
      Gender: '',
      Employer_Category: '',
      Education_Level: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    // 1. Validate Applicant Name (Cannot be numbers only)
    const nameTrimmed = String(formData.Applicant_Name || '').trim();
    if (nameTrimmed && /^\d+$/.test(nameTrimmed)) {
      setValidationError('Applicant Name cannot contain numbers only. Please enter a valid text name or leave it blank.');
      return;
    }

    // 2. Validate Non-negative numbers across all numerical fields
    const numChecks = [
      { key: 'Applicant_Income', label: 'Applicant Income' },
      { key: 'Coapplicant_Income', label: 'Co-Applicant Income' },
      { key: 'Age', label: 'Age', min: 18 },
      { key: 'Dependents', label: 'Number of Dependents' },
      { key: 'Credit_Score', label: 'Credit Score', min: 300, max: 850 },
      { key: 'Existing_Loans', label: 'Existing Loans' },
      { key: 'DTI_Ratio', label: 'DTI Ratio' },
      { key: 'Savings', label: 'Liquid Savings' },
      { key: 'Collateral_Value', label: 'Collateral Value' },
      { key: 'Loan_Amount', label: 'Requested Loan Amount' }
    ];

    for (const item of numChecks) {
      const val = formData[item.key];
      if (val !== '' && val !== null && !isNaN(Number(val))) {
        const num = Number(val);
        if (num < 0) {
          setValidationError(`${item.label} cannot be a negative number.`);
          return;
        }
        if (item.min !== undefined && num > 0 && num < item.min) {
          setValidationError(`${item.label} must be at least ${item.min}.`);
          return;
        }
        if (item.max !== undefined && num > item.max) {
          setValidationError(`${item.label} cannot exceed ${item.max}.`);
          return;
        }
      }
    }

    const cleanPayload = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] !== '' && formData[key] !== null) {
        cleanPayload[key] = formData[key];
      }
    });
    onSubmit(cleanPayload);
  };

  return (
    <div className="glass-panel" style={{ padding: '28px' }}>
      {/* Header & Mode Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={22} color="var(--accent-primary)" />
            Applicant Loan Eligibility Form
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {mode === 'quick' 
              ? 'Enter key financial details below. Optional fields remain empty if omitted.' 
              : 'Enter complete 19-point applicant details for evaluation.'}
          </p>
        </div>

        {/* Mode Switch Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-input)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => setMode('quick')}
            className="btn btn-sm"
            style={{
              background: mode === 'quick' ? 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)' : 'transparent',
              color: '#FFF',
              border: 'none'
            }}
          >
            <Zap size={14} /> Quick Fill (5 Core Fields)
          </button>
          <button
            type="button"
            onClick={() => setMode('full')}
            className="btn btn-sm"
            style={{
              background: mode === 'full' ? 'var(--accent-primary)' : 'transparent',
              color: '#FFF',
              border: 'none'
            }}
          >
            <FileText size={14} /> Full Application (All 19 Fields)
          </button>
        </div>
      </div>

      {/* Quick Test Presets Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
          ⚡ 1-Click Demo Profiles (Test Predictions Instantly):
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {activePresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset.data)}
              className="btn btn-sm btn-secondary"
              title={preset.description}
              style={{ fontSize: '0.8rem' }}
            >
              <Sparkles size={12} color="var(--accent-cyan)" />
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {validationError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#EF4444',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={18} />
          {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* SECTION 1: KEY LOAN & FINANCIAL REQUIREMENTS */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <DollarSign size={16} /> Essential Financial & Loan Parameters
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '18px'
          }}>
            {/* Applicant Name */}
            <div className="form-group">
              <label className="form-label">
                <span>Applicant Full Name</span>
                <span className="badge badge-optional">Optional</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Morgan"
                className="input-field"
                value={formData.Applicant_Name}
                onChange={e => handleChange('Applicant_Name', e.target.value)}
              />
            </div>

            {/* Applicant Income */}
            <div className="form-group">
              <label className="form-label">
                <span>Applicant Income ($ / yr) *</span>
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 15000"
                className="input-field"
                value={formData.Applicant_Income}
                onKeyDown={preventNegativeKeys}
                onInput={e => { if (e.target.value < 0) e.target.value = Math.abs(e.target.value); }}
                onChange={e => handleChange('Applicant_Income', e.target.value)}
              />
            </div>

            {/* Credit Score */}
            <div className="form-group">
              <label className="form-label">
                <span>Credit Score (300-850) *</span>
              </label>
              <input
                type="number"
                required
                min="300"
                max="850"
                placeholder="e.g. 720"
                className="input-field"
                value={formData.Credit_Score}
                onKeyDown={preventNegativeKeys}
                onInput={e => { if (e.target.value < 0) e.target.value = Math.abs(e.target.value); }}
                onChange={e => handleChange('Credit_Score', e.target.value)}
              />
            </div>

            {/* Loan Amount */}
            <div className="form-group">
              <label className="form-label">
                <span>Requested Loan Amount ($) *</span>
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 25000"
                className="input-field"
                value={formData.Loan_Amount}
                onKeyDown={preventNegativeKeys}
                onInput={e => { if (e.target.value < 0) e.target.value = Math.abs(e.target.value); }}
                onChange={e => handleChange('Loan_Amount', e.target.value)}
              />
            </div>

            {/* Loan Term */}
            <div className="form-group">
              <label className="form-label">
                <span>Loan Term (Months) *</span>
              </label>
              <select
                className="select-field"
                value={formData.Loan_Term || '36'}
                onChange={e => handleChange('Loan_Term', e.target.value)}
              >
                <option value="12">12 Months (1 Year)</option>
                <option value="24">24 Months (2 Years)</option>
                <option value="36">36 Months (3 Years)</option>
                <option value="48">48 Months (4 Years)</option>
                <option value="60">60 Months (5 Years)</option>
                <option value="72">72 Months (6 Years)</option>
                <option value="84">84 Months (7 Years)</option>
              </select>
            </div>

            {/* Employment Status */}
            <div className="form-group">
              <label className="form-label">
                <span>Employment Status *</span>
              </label>
              <select
                className="select-field"
                value={formData.Employment_Status}
                onChange={e => handleChange('Employment_Status', e.target.value)}
              >
                <option value="Salaried">Salaried</option>
                <option value="Self-employed">Self-employed</option>
                <option value="Unemployed">Unemployed</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: ADDITIONAL 14 DETAILS (FULL MODE OR EXPANDABLE) */}
        {mode === 'full' ? (
          <div className="animate-fade-in" style={{
            borderTop: '1px dashed var(--border-color)',
            paddingTop: '24px',
            marginBottom: '28px'
          }}>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--accent-primary)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Briefcase size={16} /> Extended Applicant & Property Profile (14 Additional Details)
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '18px'
            }}>
              {/* Coapplicant Income */}
              <div className="form-group">
                <label className="form-label">
                  <span>Co-Applicant Income ($)</span>
                  <span className="badge badge-optional">Optional</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 0"
                  className="input-field"
                  value={formData.Coapplicant_Income}
                  onKeyDown={preventNegativeKeys}
                  onInput={e => { if (e.target.value < 0) e.target.value = Math.abs(e.target.value); }}
                  onChange={e => handleChange('Coapplicant_Income', e.target.value)}
                />
              </div>

              {/* Age */}
              <div className="form-group">
                <label className="form-label">
                  <span>Age (Years)</span>
                  <span className="badge badge-optional">Optional</span>
                </label>
                <input
                  type="number"
                  min="18"
                  placeholder="e.g. 35"
                  className="input-field"
                  value={formData.Age}
                  onKeyDown={preventNegativeKeys}
                  onInput={e => { if (e.target.value < 0) e.target.value = Math.abs(e.target.value); }}
                  onChange={e => handleChange('Age', e.target.value)}
                />
              </div>

              {/* Dependents */}
              <div className="form-group">
                <label className="form-label">
                  <span>Number of Dependents</span>
                  <span className="badge badge-optional">Optional</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 0"
                  className="input-field"
                  value={formData.Dependents}
                  onKeyDown={preventNegativeKeys}
                  onInput={e => { if (e.target.value < 0) e.target.value = Math.abs(e.target.value); }}
                  onChange={e => handleChange('Dependents', e.target.value)}
                />
              </div>

              {/* DTI Ratio */}
              <div className="form-group">
                <label className="form-label">
                  <span>Debt-to-Income (DTI) Ratio</span>
                  <span className="badge badge-optional">Optional (0.0 - 1.0)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1.0"
                  placeholder="e.g. 0.35"
                  className="input-field"
                  value={formData.DTI_Ratio}
                  onKeyDown={preventNegativeKeys}
                  onInput={e => { if (e.target.value < 0) e.target.value = Math.abs(e.target.value); }}
                  onChange={e => handleChange('DTI_Ratio', e.target.value)}
                />
              </div>

              {/* Savings */}
              <div className="form-group">
                <label className="form-label">
                  <span>Liquid Savings ($)</span>
                  <span className="badge badge-optional">Optional</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 5000"
                  className="input-field"
                  value={formData.Savings}
                  onKeyDown={preventNegativeKeys}
                  onInput={e => { if (e.target.value < 0) e.target.value = Math.abs(e.target.value); }}
                  onChange={e => handleChange('Savings', e.target.value)}
                />
              </div>

              {/* Collateral Value */}
              <div className="form-group">
                <label className="form-label">
                  <span>Collateral Value ($)</span>
                  <span className="badge badge-optional">Optional</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 10000"
                  className="input-field"
                  value={formData.Collateral_Value}
                  onKeyDown={preventNegativeKeys}
                  onInput={e => { if (e.target.value < 0) e.target.value = Math.abs(e.target.value); }}
                  onChange={e => handleChange('Collateral_Value', e.target.value)}
                />
              </div>

              {/* Existing Loans */}
              <div className="form-group">
                <label className="form-label">
                  <span>Existing Active Loans</span>
                  <span className="badge badge-optional">Optional</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 0"
                  className="input-field"
                  value={formData.Existing_Loans}
                  onKeyDown={preventNegativeKeys}
                  onInput={e => { if (e.target.value < 0) e.target.value = Math.abs(e.target.value); }}
                  onChange={e => handleChange('Existing_Loans', e.target.value)}
                />
              </div>

              {/* Loan Purpose */}
              <div className="form-group">
                <label className="form-label">
                  <span>Loan Purpose</span>
                </label>
                <select
                  className="select-field"
                  value={formData.Loan_Purpose}
                  onChange={e => handleChange('Loan_Purpose', e.target.value)}
                >
                  <option value="">-- Not Specified --</option>
                  <option value="Personal">Personal</option>
                  <option value="Car">Car / Auto</option>
                  <option value="Business">Business</option>
                  <option value="Home">Home / Real Estate</option>
                  <option value="Education">Education</option>
                </select>
              </div>

              {/* Property Area */}
              <div className="form-group">
                <label className="form-label">
                  <span>Property Area</span>
                </label>
                <select
                  className="select-field"
                  value={formData.Property_Area}
                  onChange={e => handleChange('Property_Area', e.target.value)}
                >
                  <option value="">-- Not Specified --</option>
                  <option value="Urban">Urban</option>
                  <option value="Semiurban">Semiurban</option>
                  <option value="Rural">Rural</option>
                </select>
              </div>

              {/* Employer Category */}
              <div className="form-group">
                <label className="form-label">
                  <span>Employer Category</span>
                </label>
                <select
                  className="select-field"
                  value={formData.Employer_Category}
                  onChange={e => handleChange('Employer_Category', e.target.value)}
                >
                  <option value="">-- Not Specified --</option>
                  <option value="Private">Private Sector</option>
                  <option value="Government">Government / Public Sector</option>
                  <option value="MNC">MNC / Corporate</option>
                  <option value="Self-employed">Self-employed</option>
                  <option value="Unemployed">Unemployed</option>
                </select>
              </div>

              {/* Education Level */}
              <div className="form-group">
                <label className="form-label">
                  <span>Education Level</span>
                </label>
                <select
                  className="select-field"
                  value={formData.Education_Level}
                  onChange={e => handleChange('Education_Level', e.target.value)}
                >
                  <option value="">-- Not Specified --</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Not Graduate">Not Graduate</option>
                </select>
              </div>

              {/* Marital Status */}
              <div className="form-group">
                <label className="form-label">
                  <span>Marital Status</span>
                </label>
                <select
                  className="select-field"
                  value={formData.Marital_Status}
                  onChange={e => handleChange('Marital_Status', e.target.value)}
                >
                  <option value="">-- Not Specified --</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                </select>
              </div>

              {/* Gender */}
              <div className="form-group">
                <label className="form-label">
                  <span>Gender</span>
                </label>
                <select
                  className="select-field"
                  value={formData.Gender}
                  onChange={e => handleChange('Gender', e.target.value)}
                >
                  <option value="">-- Not Specified --</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <HelpCircle size={20} color="var(--accent-primary)" />
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Quick Fill Active: </span> 
              Core required fields are displayed above. Optional fields remain empty if omitted. Switch to <strong>Full Application</strong> mode to enter all 19 fields.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={handleClear}
            className="btn btn-secondary btn-sm"
          >
            <RotateCcw size={14} /> Clear Fields
          </button>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              padding: '12px 32px',
              fontSize: '1rem'
            }}
          >
            {loading ? (
              <>
                <Sparkles className="animate-spin" size={18} /> Analyzing ML Model...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Run AI Loan Eligibility Prediction
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
