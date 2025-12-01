import React, { useState, useEffect } from 'react';
import API_URL from '../config';

function DailyActivityReport() {
  const [dailyData, setDailyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedOffice, setSelectedOffice] = useState('');
  const [offices, setOffices] = useState([]);

  useEffect(() => {
    fetchOffices();
    fetchDailyActivity();
  }, []);

  const fetchOffices = async () => {
    try {
      const response = await fetch(`${API_URL}/offices`);
      const data = await response.json();
      setOffices(data);
    } catch (error) {
      console.error('Error fetching offices:', error);
    }
  };

  const fetchDailyActivity = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/documents/analytics/daily-activity?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      if (selectedOffice) {
        url += `&office=${selectedOffice}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setDailyData(data);
    } catch (error) {
      console.error('Error fetching daily activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilter = () => {
    fetchDailyActivity();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', fontSize: '16px', color: '#7f8c8d' }}>
        Loading daily activity report...
      </div>
    );
  }

  if (!dailyData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', fontSize: '16px', color: '#7f8c8d' }}>
        No data available
      </div>
    );
  }

  const { summary, dailyActivity, office } = dailyData;

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <h2 style={{ 
        margin: '0 0 20px 0', 
        fontSize: '22px', 
        fontWeight: '600', 
        color: '#2c3e50' 
      }}>
        Daily Activity Report
      </h2>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e1e8ed'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '13px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '13px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
              Office
            </label>
            <select
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '13px'
              }}
            >
              <option value="">All Offices</option>
              {offices.map(office => (
                <option key={office._id} value={office.name}>{office.name}</option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={handleApplyFilter}
              style={{
                width: '100%',
                padding: '8px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '15px', 
        marginBottom: '25px' 
      }}>
        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '15px',
          borderRadius: '10px',
          border: '2px solid #bbdefb',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#1976d2', fontSize: '13px', fontWeight: '600' }}>
            Total Documents
          </h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: 0, color: '#1976d2' }}>
            {summary.totalDocuments}
          </p>
          <p style={{ fontSize: '11px', color: '#7f8c8d', margin: '5px 0 0 0' }}>
            {summary.averagePerDay} per day
          </p>
        </div>

        <div style={{
          backgroundColor: '#fff3cd',
          padding: '15px',
          borderRadius: '10px',
          border: '2px solid #ffeaa7',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#f39c12', fontSize: '13px', fontWeight: '600' }}>
            Pending
          </h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: 0, color: '#f39c12' }}>
            {summary.totalPending}
          </p>
          <p style={{ fontSize: '11px', color: '#7f8c8d', margin: '5px 0 0 0' }}>
            {summary.totalDocuments > 0 ? Math.round(summary.totalPending / summary.totalDocuments * 100) : 0}% of total
          </p>
        </div>

        <div style={{
          backgroundColor: '#e8f5e8',
          padding: '15px',
          borderRadius: '10px',
          border: '2px solid #c8e6c9',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#388e3c', fontSize: '13px', fontWeight: '600' }}>
            Forwarded
          </h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: 0, color: '#388e3c' }}>
            {summary.totalForwarded}
          </p>
          <p style={{ fontSize: '11px', color: '#7f8c8d', margin: '5px 0 0 0' }}>
            {summary.totalDocuments > 0 ? Math.round(summary.totalForwarded / summary.totalDocuments * 100) : 0}% of total
          </p>
        </div>

        <div style={{
          backgroundColor: '#f0f4c3',
          padding: '15px',
          borderRadius: '10px',
          border: '2px solid #dce775',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#689f38', fontSize: '13px', fontWeight: '600' }}>
            Completed
          </h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: 0, color: '#689f38' }}>
            {summary.totalCompleted}
          </p>
          <p style={{ fontSize: '11px', color: '#7f8c8d', margin: '5px 0 0 0' }}>
            {summary.totalDocuments > 0 ? Math.round(summary.totalCompleted / summary.totalDocuments * 100) : 0}% of total
          </p>
        </div>

        <div style={{
          backgroundColor: '#ffe8e8',
          padding: '15px',
          borderRadius: '10px',
          border: '2px solid #f5c6cb',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#d32f2f', fontSize: '13px', fontWeight: '600' }}>
            Delayed
          </h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: 0, color: '#d32f2f' }}>
            {summary.totalDelayed}
          </p>
          <p style={{ fontSize: '11px', color: '#7f8c8d', margin: '5px 0 0 0' }}>
            {summary.totalDelayedHours}h total
          </p>
        </div>
      </div>

      {/* Daily Activity Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e1e8ed'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
            Daily Breakdown - {office}
          </h3>
          <span style={{ fontSize: '12px', color: '#7f8c8d' }}>
            {summary.dateRange.start} to {summary.dateRange.end}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={headerStyle}>Date</th>
                <th style={headerStyle}>Total</th>
                <th style={headerStyle}>Pending</th>
                <th style={headerStyle}>Forwarded</th>
                <th style={headerStyle}>Under Review</th>
                <th style={headerStyle}>Approved</th>
                <th style={headerStyle}>Completed</th>
                <th style={headerStyle}>Rejected</th>
                <th style={headerStyle}>Delayed</th>
                <th style={headerStyle}>Delay Hours</th>
              </tr>
            </thead>
            <tbody>
              {dailyActivity.map((day, index) => (
                <tr key={day.date} style={{
                  backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                  borderBottom: '1px solid #e9ecef'
                }}>
                  <td style={cellStyle}>
                    <strong>{new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}</strong>
                  </td>
                  <td style={{ ...cellStyle, fontWeight: '600', color: '#2c3e50' }}>{day.totalDocuments}</td>
                  <td style={cellStyle}>
                    <span style={getBadgeStyle(day.pending, '#f39c12')}>{day.pending}</span>
                  </td>
                  <td style={cellStyle}>
                    <span style={getBadgeStyle(day.forwarded, '#388e3c')}>{day.forwarded}</span>
                  </td>
                  <td style={cellStyle}>
                    <span style={getBadgeStyle(day.underReview, '#1976d2')}>{day.underReview}</span>
                  </td>
                  <td style={cellStyle}>
                    <span style={getBadgeStyle(day.approved, '#689f38')}>{day.approved}</span>
                  </td>
                  <td style={cellStyle}>
                    <span style={getBadgeStyle(day.completed, '#00897b')}>{day.completed}</span>
                  </td>
                  <td style={cellStyle}>
                    <span style={getBadgeStyle(day.rejected, '#d32f2f')}>{day.rejected}</span>
                  </td>
                  <td style={cellStyle}>
                    <span style={getBadgeStyle(day.delayed, '#d32f2f')}>{day.delayed}</span>
                  </td>
                  <td style={{ ...cellStyle, color: day.totalDelayedHours > 0 ? '#d32f2f' : '#7f8c8d' }}>
                    {day.totalDelayedHours}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {dailyActivity.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: '#7f8c8d', fontSize: '14px' }}>
            No activity found for the selected date range and office.
          </div>
        )}
      </div>
    </div>
  );
}

// Styles
const headerStyle = {
  padding: '10px',
  textAlign: 'center',
  backgroundColor: '#2c3e50',
  color: 'white',
  fontSize: '12px',
  fontWeight: '600',
  borderBottom: '2px solid #34495e'
};

const cellStyle = {
  padding: '10px',
  textAlign: 'center',
  fontSize: '13px',
  color: '#2c3e50'
};

const getBadgeStyle = (count, color) => {
  if (count === 0) {
    return {
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      backgroundColor: '#f8f9fa',
      color: '#adb5bd'
    };
  }
  return {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: `${color}20`,
    color: color
  };
};

export default DailyActivityReport;

