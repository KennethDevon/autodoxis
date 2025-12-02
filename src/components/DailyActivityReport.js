import React, { useState, useEffect } from 'react';
import API_URL from '../config';

function DailyActivityReport() {
  const [dailyData, setDailyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyActivity();
  }, []);

  const fetchDailyActivity = async () => {
    setLoading(true);
    try {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      const url = `${API_URL}/documents/analytics/daily-activity?startDate=${startDate}&endDate=${endDate}`;

      const response = await fetch(url);
      const data = await response.json();
      setDailyData(data);
    } catch (error) {
      console.error('Error fetching daily activity:', error);
    } finally {
      setLoading(false);
    }
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

  const { officeBreakdown } = dailyData;

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Office Breakdown - Documents by Submitter's Office */}
      {officeBreakdown && officeBreakdown.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '25px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e1e8ed'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600', color: '#2c3e50', textAlign: 'left' }}>
            Documents by Submitter's Office
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={headerStyle}>Office/Department</th>
                  <th style={headerStyle}>Total</th>
                  <th style={headerStyle}>Pending</th>
                  <th style={headerStyle}>Forwarded</th>
                  <th style={headerStyle}>Under Review</th>
                  <th style={headerStyle}>Approved</th>
                  <th style={headerStyle}>Completed</th>
                  <th style={headerStyle}>Rejected</th>
                  <th style={headerStyle}>Delayed</th>
                </tr>
              </thead>
              <tbody>
                {officeBreakdown.map((officeData, index) => (
                  <tr key={officeData.office} style={{
                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                    borderBottom: '1px solid #e9ecef'
                  }}>
                    <td style={{ ...cellStyle, textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>
                      {officeData.office}
                    </td>
                    <td style={{ ...cellStyle, fontWeight: '600', color: '#2c3e50' }}>{officeData.totalDocuments}</td>
                    <td style={cellStyle}>
                      <span style={getBadgeStyle(officeData.pending, '#f39c12')}>{officeData.pending}</span>
                    </td>
                    <td style={cellStyle}>
                      <span style={getBadgeStyle(officeData.forwarded, '#388e3c')}>{officeData.forwarded}</span>
                    </td>
                    <td style={cellStyle}>
                      <span style={getBadgeStyle(officeData.underReview, '#1976d2')}>{officeData.underReview}</span>
                    </td>
                    <td style={cellStyle}>
                      <span style={getBadgeStyle(officeData.approved, '#689f38')}>{officeData.approved}</span>
                    </td>
                    <td style={cellStyle}>
                      <span style={getBadgeStyle(officeData.completed, '#00897b')}>{officeData.completed}</span>
                    </td>
                    <td style={cellStyle}>
                      <span style={getBadgeStyle(officeData.rejected, '#d32f2f')}>{officeData.rejected}</span>
                    </td>
                    <td style={cellStyle}>
                      <span style={getBadgeStyle(officeData.delayed, '#d32f2f')}>{officeData.delayed}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

