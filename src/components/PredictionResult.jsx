import React from 'react';
import { 
  CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ShieldAlert, 
  TrendingUp, Info, PieChart, Sparkles 
} from 'lucide-react';

export default function PredictionResult({ result }) {
  if (!result) return null;

  const isApproved = result.prediction === 'Approved';
  const prob = result.approval_probability || 0;
  const riskLevel = result.risk_level || 'Moderate Risk';

  let riskBadgeClass = 'badge-info';
  if (riskLevel.includes('Low')) riskBadgeClass = 'badge-success';
  else if (riskLevel.includes('Moderate')) riskBadgeClass = 'badge-warning';
  else if (riskLevel.includes('High') || riskLevel.includes('Critical')) riskBadgeClass = 'badge-danger';

  return (
    <div className={`glass-panel animate-fade-in ${isApproved ? 'glow-success' : 'glow-danger'}`} style={{
      padding: '28px',
      marginTop: '24px',
      borderWidth: '2px'
    }}>
      {/* Header Notification Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid var(--border-color)',
        padding: '10px 16px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <Sparkles size={16} color="var(--accent-cyan)" />
          <span>Evaluation Analysis for <strong>{result.applicant_name}</strong></span>
        </div>
        <span className="badge badge-info">Random Forest Model</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        alignItems: 'center'
      }}>
        {/* Outcome Card */}
        <div style={{ textAlign: 'center', padding: '16px' }}>
          {isApproved ? (
            <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', marginBottom: '16px' }}>
              <CheckCircle2 size={64} color="var(--success)" className="pulse-glow" />
            </div>
          ) : (
            <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', marginBottom: '16px' }}>
              <XCircle size={64} color="var(--danger)" />
            </div>
          )}

          <h3 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: isApproved ? 'var(--success)' : 'var(--danger)',
            letterSpacing: '-0.5px'
          }}>
            {isApproved ? 'LOAN APPROVED' : 'LOAN REJECTED'}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {isApproved 
              ? 'The AI Model evaluates this candidate as ELIGIBLE for loan disbursement.'
              : 'The AI Model evaluates this candidate as HIGH RISK or NOT ELIGIBLE for this loan amount.'}
          </p>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <span className={`badge ${riskBadgeClass}`} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
              {isApproved ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />} {riskLevel}
            </span>
            <span className="badge badge-info" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
              Confidence: {prob}%
            </span>
          </div>
        </div>

        {/* Confidence Meter & Key Metrics */}
        <div style={{
          background: 'var(--bg-input)',
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Approval Confidence Score</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: isApproved ? 'var(--success)' : 'var(--danger)' }}>
              {prob}%
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '12px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '20px'
          }}>
            <div style={{
              width: `${prob}%`,
              height: '100%',
              background: isApproved 
                ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)' 
                : 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
              borderRadius: '6px',
              transition: 'width 1s ease-in-out'
            }} />
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Annual Income</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                ${result.metrics?.total_income?.toLocaleString() || 0}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Income / Loan Ratio</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                {result.metrics?.income_to_loan_ratio || 0}x
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Collateral Coverage</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                {result.metrics?.collateral_coverage || 0}%
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Credit Score Evaluated</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                {result.processed_details?.Credit_Score || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Reasoning Insights */}
      <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="var(--accent-primary)" />
          AI Model Evaluation Breakdown & Financial Drivers
        </h4>

        <div style={{ display: 'grid', gap: '10px' }}>
          {result.insights && result.insights.length > 0 ? (
            result.insights.map((insight, idx) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                color: 'var(--text-primary)'
              }}>
                {insight}
              </div>
            ))
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Model prediction generated based on applicant parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
