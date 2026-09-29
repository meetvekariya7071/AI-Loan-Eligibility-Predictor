import React from 'react';
import { Landmark, Sparkles, Database, BarChart3, ShieldCheck, Server } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, stats, mongoStatus, onOpenMongoModal }) {
  return (
    <nav style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '16px 24px'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Landmark size={24} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px' }} className="title-gradient">
                LoanPulse AI
              </span>
              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                <Sparkles size={10} /> ML Model Powered
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Loan Eligibility & Risk Prediction System
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setActiveTab('predict')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'predict' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'predict' ? '#FFF' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <Sparkles size={16} /> Predict Eligibility
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'database' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'database' ? '#FFF' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <Database size={16} /> Database Register
            {stats?.total_applications > 0 && (
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '0.7rem'
              }}>
                {stats.total_applications}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'analytics' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'analytics' ? '#FFF' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <BarChart3 size={16} /> Analytics & Model Insights
          </button>
        </div>

        {/* MongoDB Connection Status Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onOpenMongoModal}
            className="btn btn-sm btn-secondary"
            style={{
              borderColor: mongoStatus?.connected ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)',
              background: mongoStatus?.connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <Server size={14} color={mongoStatus?.connected ? 'var(--success)' : 'var(--text-muted)'} />
            <span style={{ fontSize: '0.78rem' }}>
              {mongoStatus?.connected ? '🍃 MongoDB Connected' : '🍃 Connect MongoDB'}
            </span>
          </button>

          {/* Model Live Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '6px 12px',
            borderRadius: '20px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--success)',
              boxShadow: '0 0 10px var(--success)'
            }} className="pulse-glow" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)' }}>
              Random Forest (86%)
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
