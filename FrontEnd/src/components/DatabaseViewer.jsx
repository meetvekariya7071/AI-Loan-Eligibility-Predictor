import React, { useState, useEffect } from 'react';
import { 
  Database, Search, Filter, Download, RefreshCw, Eye, 
  CheckCircle, XCircle, ShieldCheck, ShieldAlert, Calendar, X, Server,
  ChevronLeft, ChevronRight, ArrowUpDown
} from 'lucide-react';

export default function DatabaseViewer({ onRefreshStats }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('ASC'); // 'ASC' (ID 1 -> 1000) or 'DESC' (Newest first)
  const [selectedApp, setSelectedApp] = useState(null);
  const [mongoInfo, setMongoInfo] = useState(null);

  // Pagination State (100 items per page range)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100;

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter)}&sort=${sortOrder}&limit=2000`);
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications || []);
        setCurrentPage(1); // Reset to page 1 on new query/sort change
      }

      const mongoRes = await fetch('/api/mongodb/status');
      const mongoData = await mongoRes.json();
      if (mongoData.success) {
        setMongoInfo(mongoData.mongodb);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [search, statusFilter, sortOrder]);

  // Calculate Paginated Slice
  const totalCount = applications.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const currentRecords = applications.slice(startIndex, endIndex);

  // Generate Accurate Page Range Labels based on Sort Order
  const pageRanges = [];
  for (let p = 1; p <= totalPages; p++) {
    const pStart = (p - 1) * pageSize + 1;
    const pEnd = Math.min(p * pageSize, totalCount);
    
    let label = `${pStart} – ${pEnd}`;
    if (sortOrder === 'ASC') {
      label = `ID #${pStart} – #${pEnd}`;
    } else {
      label = `Records ${pStart} – ${pEnd} (Newest)`;
    }

    pageRanges.push({
      page: p,
      label: label
    });
  }

  const handleExportCSV = () => {
    if (!applications.length) return;
    const headers = Object.keys(applications[0]).join(',');
    const rows = applications.map(app => 
      Object.values(app).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `loan_applications_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel" style={{ padding: '28px' }}>
      {/* Table Header & Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={22} color="var(--accent-cyan)" />
            Database Applications Register ({totalCount.toLocaleString()} Total Records)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Paginated in 100-record blocks. Saved in <code>loan_applications.db</code> &amp; MongoDB <code>loan_db</code>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={fetchApplications} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh DB
          </button>
          <button onClick={handleExportCSV} className="btn btn-accent btn-sm">
            <Download size={14} /> Export CSV ({totalCount})
          </button>
        </div>
      </div>

      {/* Dual DB Banner (SQLite & MongoDB status) */}
      <div style={{
        background: 'var(--bg-input)',
        border: '1px solid var(--border-color)',
        padding: '14px 18px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={16} color="var(--accent-cyan)" />
            <span>SQLite DB: <strong>{totalCount} Records</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Server size={16} color={mongoInfo?.connected ? 'var(--success)' : 'var(--text-muted)'} />
            <span>
              MongoDB: {mongoInfo?.connected 
                ? <strong style={{ color: 'var(--success)' }}>Connected ({mongoInfo?.count || 0} Docs in loan_db)</strong> 
                : <span style={{ color: 'var(--text-muted)' }}>Disconnected (URI: {mongoInfo?.uri})</span>}
            </span>
          </div>
        </div>

        <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
          Database: loan_approval_db &bull; Collection: loan_applications
        </span>
      </div>

      {/* Search, Filter & Sort Controls Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, loan purpose, or status..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Filter Dropdown */}
          <div style={{ minWidth: '140px' }}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="select-field"
            >
              <option value="All">All Predictions</option>
              <option value="Approved">Approved Only</option>
              <option value="Rejected">Rejected Only</option>
            </select>
          </div>

          {/* Sort Order Selector */}
          <div style={{ minWidth: '180px' }}>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="select-field"
              style={{ fontWeight: 600 }}
            >
              <option value="ASC">Sort: ID 1 ➔ 1000 (Ascending)</option>
              <option value="DESC">Sort: Newest First (Descending)</option>
            </select>
          </div>
        </div>

        {/* 100-Record Range Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Select Range:
          </span>
          <select
            value={currentPage}
            onChange={e => setCurrentPage(Number(e.target.value))}
            className="select-field"
            style={{ width: '190px', fontWeight: 700, color: 'var(--accent-cyan)' }}
          >
            {pageRanges.map(range => (
              <option key={range.page} value={range.page}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Page Ranges Quick Pills Bar (1-100, 101-200, 201-300...) */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '12px',
        marginBottom: '16px'
      }}>
        {pageRanges.map(range => (
          <button
            key={range.page}
            onClick={() => setCurrentPage(range.page)}
            className="btn btn-sm"
            style={{
              background: currentPage === range.page ? 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)' : 'rgba(255,255,255,0.04)',
              color: currentPage === range.page ? '#FFF' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              whiteSpace: 'nowrap',
              fontSize: '0.8rem',
              padding: '6px 12px'
            }}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Range Status Info Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)'
      }}>
        <span>
          Showing records <strong>{totalCount > 0 ? startIndex + 1 : 0} – {endIndex}</strong> of <strong>{totalCount.toLocaleString()}</strong> ({sortOrder === 'ASC' ? 'Sorted ID #1 to #1000' : 'Sorted Newest First'})
        </span>
        <span>
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Database Table */}
      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px 16px' }}>ID</th>
              <th style={{ padding: '12px 16px' }}>Applicant Name</th>
              <th style={{ padding: '12px 16px' }}>Income</th>
              <th style={{ padding: '12px 16px' }}>Credit Score</th>
              <th style={{ padding: '12px 16px' }}>Loan Requested</th>
              <th style={{ padding: '12px 16px' }}>Purpose</th>
              <th style={{ padding: '12px 16px' }}>Prediction</th>
              <th style={{ padding: '12px 16px' }}>Confidence</th>
              <th style={{ padding: '12px 16px' }}>Risk Level</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading database records...
                </td>
              </tr>
            ) : currentRecords.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No applicant records found for this criteria.
                </td>
              </tr>
            ) : (
              currentRecords.map((app) => (
                <tr 
                  key={app.id} 
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>#{app.id}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{app.applicant_name}</td>
                  <td style={{ padding: '12px 16px' }}>${app.applicant_income?.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{app.credit_score}</td>
                  <td style={{ padding: '12px 16px' }}>${app.loan_amount?.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}>{app.loan_purpose}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${app.prediction === 'Approved' ? 'badge-success' : 'badge-danger'}`}>
                      {app.prediction === 'Approved' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {app.prediction}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                    {(app.approval_probability * (app.approval_probability <= 1 ? 100 : 1)).toFixed(1)}%
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                      {app.risk_level}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '4px 10px' }}
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Active Range: <strong>{pageRanges[currentPage - 1]?.label || ''}</strong>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            className="btn btn-sm btn-secondary"
          >
            <ChevronLeft size={16} /> Previous Range
          </button>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0 8px' }}>
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            className="btn btn-sm btn-secondary"
          >
            Next Range <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* FULL RECORD MODAL */}
      {selectedApp && (
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
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedApp(null)}
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

            <div style={{ marginBottom: '20px' }}>
              <div className="badge badge-info" style={{ marginBottom: '8px' }}>
                Application Record #{selectedApp.id}
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {selectedApp.applicant_name}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Recorded on {new Date(selectedApp.created_at).toLocaleString()}
              </p>
            </div>

            {/* Prediction Banner */}
            <div style={{
              background: selectedApp.prediction === 'Approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${selectedApp.prediction === 'Approved' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                  ML Model Outcome
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: selectedApp.prediction === 'Approved' ? 'var(--success)' : 'var(--danger)' }}>
                  {selectedApp.prediction === 'Approved' ? 'LOAN APPROVED' : 'LOAN REJECTED'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence Score</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  {(selectedApp.approval_probability * (selectedApp.approval_probability <= 1 ? 100 : 1)).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* All Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '0.85rem'
            }}>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Applicant Income:</span> <strong>${selectedApp.applicant_income?.toLocaleString()}</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Co-Applicant Income:</span> <strong>${selectedApp.coapplicant_income?.toLocaleString()}</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Credit Score:</span> <strong>{selectedApp.credit_score}</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Loan Amount:</span> <strong>${selectedApp.loan_amount?.toLocaleString()}</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Loan Term:</span> <strong>{selectedApp.loan_term} Months</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Loan Purpose:</span> <strong>{selectedApp.loan_purpose}</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Employment Status:</span> <strong>{selectedApp.employment_status}</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Employer Category:</span> <strong>{selectedApp.employer_category}</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Education Level:</span> <strong>{selectedApp.education_level}</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>DTI Ratio:</span> <strong>{selectedApp.dti_ratio}</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Liquid Savings:</span> <strong>${selectedApp.savings?.toLocaleString()}</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Collateral Value:</span> <strong>${selectedApp.collateral_value?.toLocaleString()}</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Existing Loans:</span> <strong>{selectedApp.existing_loans}</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Property Area:</span> <strong>{selectedApp.property_area}</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Age / Dependents:</span> <strong>{selectedApp.age} yrs / {selectedApp.dependents} deps</strong>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Marital / Gender:</span> <strong>{selectedApp.marital_status} / {selectedApp.gender}</strong>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button onClick={() => setSelectedApp(null)} className="btn btn-secondary btn-sm">
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
