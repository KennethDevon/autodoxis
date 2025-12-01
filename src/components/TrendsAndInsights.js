import React, { useState, useEffect } from 'react';
import API_URL from '../config';

function TrendsAndInsights() {
  const [trendsData, setTrendsData] = useState(null);
  const [patternsData, setPatternsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [months, setMonths] = useState(6);
  const [patternMonths, setPatternMonths] = useState(3);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [trendsResponse, patternsResponse] = await Promise.all([
        fetch(`${API_URL}/documents/analytics/trends?period=${period}&months=${months}`),
        fetch(`${API_URL}/documents/analytics/patterns?months=${patternMonths}`)
      ]);

      const trendsData = await trendsResponse.json();
      const patternsData = await patternsResponse.json();

      setTrendsData(trendsData);
      setPatternsData(patternsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return { bg: '#ffe8e8', border: '#f5c6cb', color: '#d32f2f' };
      case 'medium':
        return { bg: '#fff3cd', border: '#ffeaa7', color: '#f39c12' };
      case 'low':
        return { bg: '#e8f5e8', border: '#c8e6c9', color: '#388e3c' };
      default:
        return { bg: '#f8f9fa', border: '#e1e8ed', color: '#2c3e50' };
    }
  };

  const getTrendIcon = (status) => {
    switch (status) {
      case 'improving':
        return { icon: '↗', color: '#388e3c' };
      case 'declining':
        return { icon: '↘', color: '#d32f2f' };
      default:
        return { icon: '→', color: '#7f8c8d' };
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', fontSize: '16px', color: '#7f8c8d' }}>
        Loading trends and insights...
      </div>
    );
  }

  if (!trendsData || !patternsData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', fontSize: '16px', color: '#7f8c8d' }}>
        No analytics data available
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <h2 style={{ 
        margin: '0 0 25px 0', 
        fontSize: '24px', 
        fontWeight: '600', 
        color: '#2c3e50' 
      }}>
        Trends & Insights Dashboard
      </h2>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '25px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e1e8ed'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
              Time Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '13px'
              }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
              Months to Analyze
            </label>
            <select
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '13px'
              }}
            >
              <option value={3}>Last 3 Months</option>
              <option value={6}>Last 6 Months</option>
              <option value={12}>Last 12 Months</option>
            </select>
          </div>
          <div>
            <button
              onClick={fetchAnalytics}
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
              Refresh Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Key Insights Section */}
      {patternsData.insights && patternsData.insights.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '25px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e1e8ed'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
            Key Insights & Recommendations
          </h3>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            {patternsData.insights.map((insight, index) => {
              const colors = getSeverityColor(insight.severity);
              return (
                <div
                  key={index}
                  style={{
                    backgroundColor: colors.bg,
                    border: `2px solid ${colors.border}`,
                    borderRadius: '10px',
                    padding: '20px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: colors.color }}>
                      {insight.title}
                    </h4>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: colors.color,
                      color: 'white'
                    }}>
                      {insight.severity.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ margin: '10px 0', fontSize: '14px', color: '#2c3e50' }}>
                    {insight.description}
                  </p>
                  <div style={{
                    marginTop: '15px',
                    padding: '12px',
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    borderRadius: '6px',
                    borderLeft: `4px solid ${colors.color}`
                  }}>
                    <strong style={{ fontSize: '13px', color: colors.color }}>Recommendation:</strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#2c3e50' }}>
                      {insight.recommendation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trends Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e1e8ed'
        }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '600', color: '#7f8c8d' }}>
            Processing Time Trend
          </h4>
          {trendsData.trends.processingTime && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '32px',
                  color: getTrendIcon(trendsData.trends.processingTime.status).color
                }}>
                  {getTrendIcon(trendsData.trends.processingTime.status).icon}
                </span>
                <span style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: getTrendIcon(trendsData.trends.processingTime.status).color
                }}>
                  {trendsData.trends.processingTime.change > 0 ? '+' : ''}
                  {trendsData.trends.processingTime.change}h
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#7f8c8d' }}>
                {trendsData.trends.processingTime.status === 'improving' ? 'Processing faster' :
                 trendsData.trends.processingTime.status === 'declining' ? 'Processing slower' :
                 'No significant change'}
              </p>
            </div>
          )}
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e1e8ed'
        }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '600', color: '#7f8c8d' }}>
            Delay Rate Trend
          </h4>
          {trendsData.trends.delayRate && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '32px',
                  color: getTrendIcon(trendsData.trends.delayRate.status).color
                }}>
                  {getTrendIcon(trendsData.trends.delayRate.status).icon}
                </span>
                <span style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: getTrendIcon(trendsData.trends.delayRate.status).color
                }}>
                  {trendsData.trends.delayRate.change > 0 ? '+' : ''}
                  {trendsData.trends.delayRate.change}%
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#7f8c8d' }}>
                {trendsData.trends.delayRate.status === 'improving' ? 'Fewer delays' :
                 trendsData.trends.delayRate.status === 'declining' ? 'More delays' :
                 'No significant change'}
              </p>
            </div>
          )}
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e1e8ed'
        }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '600', color: '#7f8c8d' }}>
            Completion Rate Trend
          </h4>
          {trendsData.trends.completionRate && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '32px',
                  color: getTrendIcon(trendsData.trends.completionRate.status).color
                }}>
                  {getTrendIcon(trendsData.trends.completionRate.status).icon}
                </span>
                <span style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: getTrendIcon(trendsData.trends.completionRate.status).color
                }}>
                  {trendsData.trends.completionRate.change > 0 ? '+' : ''}
                  {trendsData.trends.completionRate.change}%
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#7f8c8d' }}>
                {trendsData.trends.completionRate.status === 'improving' ? 'More completions' :
                 trendsData.trends.completionRate.status === 'declining' ? 'Fewer completions' :
                 'No significant change'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Time Series Data */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '25px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e1e8ed'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
          Historical Performance ({period === 'monthly' ? 'Monthly' : period === 'weekly' ? 'Weekly' : 'Daily'})
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Period</th>
                <th style={tableHeaderStyle}>Total Docs</th>
                <th style={tableHeaderStyle}>Completed</th>
                <th style={tableHeaderStyle}>Pending</th>
                <th style={tableHeaderStyle}>Delayed</th>
                <th style={tableHeaderStyle}>Delay Rate</th>
                <th style={tableHeaderStyle}>Avg Processing Time</th>
                <th style={tableHeaderStyle}>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {trendsData.timeSeries.map((row, index) => (
                <tr key={index} style={{
                  backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                  borderBottom: '1px solid #e9ecef'
                }}>
                  <td style={tableCellStyle}><strong>{row.period}</strong></td>
                  <td style={tableCellStyle}>{row.totalDocuments}</td>
                  <td style={tableCellStyle}>
                    <span style={{ color: '#388e3c', fontWeight: '600' }}>{row.completedDocuments}</span>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{ color: '#f39c12', fontWeight: '600' }}>{row.pendingDocuments}</span>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{ color: '#d32f2f', fontWeight: '600' }}>{row.delayedDocuments}</span>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: row.delayRate > 30 ? '#ffe8e8' : row.delayRate > 15 ? '#fff3cd' : '#e8f5e8',
                      color: row.delayRate > 30 ? '#d32f2f' : row.delayRate > 15 ? '#f39c12' : '#388e3c'
                    }}>
                      {row.delayRate}%
                    </span>
                  </td>
                  <td style={tableCellStyle}>{row.averageProcessingTime}h</td>
                  <td style={tableCellStyle}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: row.completionRate > 70 ? '#e8f5e8' : row.completionRate > 40 ? '#fff3cd' : '#ffe8e8',
                      color: row.completionRate > 70 ? '#388e3c' : row.completionRate > 40 ? '#f39c12' : '#d32f2f'
                    }}>
                      {row.completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recurring Delay Patterns */}
      {patternsData.recurringDelayPatterns && patternsData.recurringDelayPatterns.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '25px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e1e8ed'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
            Recurring Delay Patterns
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Office</th>
                  <th style={tableHeaderStyle}>Document Type</th>
                  <th style={tableHeaderStyle}>Total</th>
                  <th style={tableHeaderStyle}>Delayed</th>
                  <th style={tableHeaderStyle}>Delay Rate</th>
                  <th style={tableHeaderStyle}>Avg Delay Hours</th>
                  <th style={tableHeaderStyle}>Severity</th>
                </tr>
              </thead>
              <tbody>
                {patternsData.recurringDelayPatterns.map((pattern, index) => {
                  const colors = getSeverityColor(pattern.severity);
                  return (
                    <tr key={index} style={{
                      backgroundColor: index % 2 === 0 ? colors.bg : 'white',
                      borderBottom: '1px solid #e9ecef'
                    }}>
                      <td style={{ ...tableCellStyle, fontWeight: '600' }}>{pattern.office}</td>
                      <td style={tableCellStyle}>{pattern.documentType}</td>
                      <td style={tableCellStyle}>{pattern.total}</td>
                      <td style={tableCellStyle}><span style={{ color: '#d32f2f', fontWeight: '600' }}>{pattern.delayed}</span></td>
                      <td style={tableCellStyle}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: colors.color,
                          color: 'white'
                        }}>
                          {pattern.delayRate}%
                        </span>
                      </td>
                      <td style={tableCellStyle}>{pattern.averageDelayHours}h</td>
                      <td style={tableCellStyle}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: colors.border,
                          color: colors.color
                        }}>
                          {pattern.severity.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottleneck Offices */}
      {patternsData.bottleneckOffices && patternsData.bottleneckOffices.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '25px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e1e8ed'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
            Bottleneck Offices
          </h3>

          <div style={{ display: 'grid', gap: '15px' }}>
            {patternsData.bottleneckOffices.map((office, index) => (
              <div
                key={index}
                style={{
                  padding: '20px',
                  backgroundColor: '#ffe8e8',
                  border: '2px solid #f5c6cb',
                  borderRadius: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#d32f2f' }}>
                    {office.office}
                  </h4>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: '#d32f2f',
                    color: 'white'
                  }}>
                    BOTTLENECK
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginTop: '15px' }}>
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#7f8c8d' }}>Documents Processed</p>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>{office.total}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#7f8c8d' }}>Delayed</p>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#d32f2f' }}>{office.delayed}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#7f8c8d' }}>Delay Rate</p>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#d32f2f' }}>{office.delayRate}%</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#7f8c8d' }}>Avg Processing Time</p>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#f39c12' }}>{office.averageProcessingTime}h</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const tableHeaderStyle = {
  padding: '12px',
  textAlign: 'center',
  backgroundColor: '#2c3e50',
  color: 'white',
  fontSize: '13px',
  fontWeight: '600',
  borderBottom: '2px solid #34495e'
};

const tableCellStyle = {
  padding: '12px',
  textAlign: 'center',
  fontSize: '13px',
  color: '#2c3e50'
};

export default TrendsAndInsights;

