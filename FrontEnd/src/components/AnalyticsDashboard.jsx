import React from 'react';
import { 
  BarChart3, Users, CheckCircle2, XCircle, DollarSign, 
  CreditCard, ShieldCheck, Cpu, Database, Activity, Award 
} from 'lucide-react';

export default function AnalyticsDashboard({ stats }) {
  if (!stats) return null;

  const total = stats.total_applications || 0;
  const approved = stats.approved_count || 0;
  const rejected = stats.rejected_count || 0;
  const approvalRate = stats.approval_rate || 0;

  return (
    <div className="glass-panel" style={{ padding: '28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={22} color="var(--accent-primary)" />
          AI Model Analytics & System Dashboard
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Live metrics calculated from predictions and SQLite database records.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Card 1: Total Applications */}
        <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Evaluated</span>
            <Users size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }}>
            {total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Applications in SQLite DB
          </div>
        </div>

        {/* Card 2: Approval Rate */}
        <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Approval Rate</span>
            <Activity size={18} color="var(--success)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: 'var(--success)' }}>
            {approvalRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {approved} Approved / {rejected} Rejected
          </div>
        </div>

        {/* Card 3: Avg Credit Score */}
        <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Avg Credit Score</span>
            <CreditCard size={18} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }}>
            {stats.avg_credit_score}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Evaluated candidates average
          </div>
        </div>

        {/* Card 4: Avg Loan Amount */}
        <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Avg Loan Requested</span>
            <DollarSign size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }}>
            ${stats.avg_loan_amount?.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Avg DTI Ratio: {stats.avg_dti_ratio}
          </div>
        </div>
      </div>

      {/* Visual Approval Distribution Bar */}
      <div style={{
        background: 'var(--bg-input)',
        padding: '24px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Loan Decision Distribution</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Approved vs Rejected Breakdown
          </span>
        </div>

        <div style={{
          height: '20px',
          width: '100%',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '10px',
          overflow: 'hidden',
          display: 'flex',
          marginBottom: '16px'
        }}>
          <div style={{
            width: `${approvalRate}%`,
            background: 'var(--success)',
            transition: 'width 1s ease'
          }} />
          <div style={{
            width: `${100 - approvalRate}%`,
            background: 'var(--danger)',
            transition: 'width 1s ease'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }} />
            <span>Approved: <strong>{approved}</strong> ({approvalRate}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)' }} />
            <span>Rejected: <strong>{rejected}</strong> ({(100 - approvalRate).toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {/* Trained Model Specifications Card */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.05)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        padding: '24px',
        borderRadius: 'var(--radius-md)'
      }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={20} color="var(--accent-primary)" />
          Trained ML Model Architecture & Data Standards
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Classifier Algorithm:</span>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>Random Forest Ensemble (120 Trees)</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Benchmark Test Accuracy:</span>
            <div style={{ fontWeight: 700, color: 'var(--success)', marginTop: '2px' }}>86.00% Validation Accuracy</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Original Dataset Size:</span>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>1,000 Records (loan_approval_data.csv)</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Feature Dimension:</span>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>27 Engineered Feature Columns</div>
          </div>
        </div>
      </div>
    </div>
  );
}
