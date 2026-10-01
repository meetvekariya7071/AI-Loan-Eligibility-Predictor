import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoanForm from './components/LoanForm';
import PredictionResult from './components/PredictionResult';
import { runClientSidePrediction } from './utils/fallbackPredictor';

export default function App() {
  const [presets, setPresets] = useState([]);
  const [defaults, setDefaults] = useState({});
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPresetsAndDefaults = async () => {
    try {
      const [presetsRes, defaultsRes] = await Promise.all([
        fetch('/api/presets'),
        fetch('/api/defaults')
      ]);
      if (presetsRes.ok && defaultsRes.ok) {
        const presetsData = await presetsRes.json();
        const defaultsData = await defaultsRes.json();
        setPresets(presetsData.presets || []);
        setDefaults(defaultsData.defaults || {});
        return;
      }
    } catch (err) {
      console.warn('Backend configuration endpoint unavailable, using smart defaults fallback:', err);
    }
  };

  useEffect(() => {
    fetchPresetsAndDefaults();
  }, []);

  const handlePredict = async (formData) => {
    setLoading(true);
    setError('');
    let serverSuccess = false;
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setPredictionResult(data.data);
          serverSuccess = true;
        }
      }
    } catch (err) {
      console.warn('Backend serverless route unreachable, utilizing local AI model prediction engine:', err);
    }

    if (!serverSuccess) {
      try {
        const fallbackData = runClientSidePrediction(formData, defaults);
        setPredictionResult(fallbackData);
      } catch (fallbackErr) {
        setError('Failed to compute prediction analysis.');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '32px 24px',
        flex: 1
      }}>
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            fontSize: '0.9rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        <div>
          <LoanForm
            onSubmit={handlePredict}
            loading={loading}
            presets={presets}
            defaults={defaults}
          />

          {predictionResult && (
            <PredictionResult 
              result={predictionResult} 
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '20px 24px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        background: 'rgba(11, 15, 25, 0.9)'
      }}>
        LoanPulse AI System &bull; Predictive ML Model &bull; High Precision Random Forest Classifier &bull; Vercel Serverless Ready
      </footer>
    </div>
  );
}
