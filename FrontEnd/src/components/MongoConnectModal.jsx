import React, { useState } from 'react';
import { Server, CheckCircle2, XCircle, RefreshCw, X, Link2 } from 'lucide-react';

export default function MongoConnectModal({ isOpen, onClose, mongoStatus, onConnect }) {
  const [uri, setUri] = useState(mongoStatus?.uri || 'mongodb://localhost:27017/loan_approval_db');
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async (e) => {
    e.preventDefault();
    setConnecting(true);
    setMessage('');
    try {
      const res = await fetch('/api/mongodb/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri })
      });
      const data = await res.json();
      setIsSuccess(data.success);
      setMessage(data.message);
      if (data.success) {
        onConnect();
      }
    } catch (err) {
      setIsSuccess(false);
      setMessage('Failed to reach backend MongoDB connection API.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '560px',
        width: '100%',
        padding: '28px',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Server size={22} color="var(--success)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Connect MongoDB Database</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Configure your local or MongoDB Atlas Cloud URI connection link
            </p>
          </div>
        </div>

        <form onSubmit={handleConnect}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">
              <span>MongoDB Connection Link (URI)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Link2 size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                required
                placeholder="mongodb://localhost:27017/loan_approval_db or mongodb+srv://..."
                value={uri}
                onChange={e => setUri(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '36px' }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Database: <strong>loan_approval_db</strong> &bull; Collection: <strong>loan_applications</strong>
            </div>
          </div>

          {/* Preset Example Quick Links */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Quick Presets:</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '0.75rem' }}
                onClick={() => setUri('mongodb://localhost:27017/loan_approval_db')}
              >
                Local MongoDB (loan_approval_db)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '0.75rem' }}
                onClick={() => setUri('mongodb://127.0.0.1:27017/loan_approval_db')}
              >
                127.0.0.1:27017
              </button>
            </div>
          </div>

          {/* Feedback Message */}
          {message && (
            <div style={{
              background: isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: isSuccess ? 'var(--success)' : 'var(--danger)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {isSuccess ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              {message}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={connecting} className="btn btn-primary btn-sm">
              {connecting ? <RefreshCw className="animate-spin" size={14} /> : <Server size={14} />}
              {connecting ? 'Connecting...' : 'Connect & Sync MongoDB'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
