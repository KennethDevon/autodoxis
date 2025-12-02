import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import API_URL from '../config';

function TrendsAndInsights() {
  const [trendsData, setTrendsData] = useState(null);
  const [patternsData, setPatternsData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [months, setMonths] = useState(6);
  const [patternMonths, setPatternMonths] = useState(3);
  const [expandedDeptApproval, setExpandedDeptApproval] = useState(new Set());

  useEffect(() => {
    fetchAnalytics();
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_URL}/documents`);
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

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

  const toggleDeptApproval = (deptName) => {
    const newExpanded = new Set(expandedDeptApproval);
    if (newExpanded.has(deptName)) {
      newExpanded.delete(deptName);
    } else {
      newExpanded.add(deptName);
    }
    setExpandedDeptApproval(newExpanded);
  };

  const formatHours = (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)} hrs`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      if (remainingHours < 1) {
        return `${days} day${days > 1 ? 's' : ''}`;
      }
      return `${days} day${days > 1 ? 's' : ''} ${remainingHours.toFixed(1)} hrs`;
    }
  };

  const getDepartmentApprovalTimes = () => {
    const departmentStats = {};
    
    documents.forEach(doc => {
      if (!doc.routingHistory || doc.routingHistory.length === 0) return;
      
      const officeVisits = {};
      
      doc.routingHistory.forEach((entry, index) => {
        const officeName = entry.office || doc.currentOffice || 'Unknown';
        const nextEntry = index < doc.routingHistory.length - 1 ? doc.routingHistory[index + 1] : null;
        
        if (!departmentStats[officeName]) {
          departmentStats[officeName] = {
            department: officeName,
            totalDocuments: 0,
            totalProcessingTimes: [],
            averageHours: 0,
            minHours: 0,
            maxHours: 0,
            completedDocuments: 0,
            documentIds: new Set(),
            documents: []
          };
        }
        
        if (entry.action === 'received' || 
            (entry.action === 'forwarded' && nextEntry && nextEntry.office === officeName)) {
          if (!officeVisits[officeName]) {
            officeVisits[officeName] = {
              arrivalTime: new Date(entry.timestamp),
              departureTime: null
            };
            if (!departmentStats[officeName].documentIds) {
              departmentStats[officeName].documentIds = new Set();
            }
            departmentStats[officeName].documentIds.add(doc.documentId);
          }
        }
        
        if (officeVisits[officeName] && officeVisits[officeName].arrivalTime && !officeVisits[officeName].departureTime) {
          if (entry.action === 'forwarded' && entry.office === officeName && nextEntry && nextEntry.office !== officeName) {
            officeVisits[officeName].departureTime = new Date(entry.timestamp);
          } else if ((entry.action === 'approved' || entry.action === 'rejected') && entry.office === officeName) {
            if (!nextEntry || nextEntry.office !== officeName) {
              officeVisits[officeName].departureTime = new Date(entry.timestamp);
            }
          }
        }
      });
      
      Object.keys(officeVisits).forEach(officeName => {
        const visit = officeVisits[officeName];
        if (visit.arrivalTime && visit.departureTime) {
          const processingTimeHours = (visit.departureTime - visit.arrivalTime) / (1000 * 60 * 60);
          
          if (processingTimeHours >= 0) {
            departmentStats[officeName].totalProcessingTimes.push(processingTimeHours);
            departmentStats[officeName].completedDocuments += 1;
            
            const expectedHours = doc.expectedProcessingTime || 24;
            const isDelayed = processingTimeHours > expectedHours;
            const delayHours = isDelayed ? processingTimeHours - expectedHours : 0;
            
            departmentStats[officeName].documents.push({
              documentId: doc.documentId,
              documentName: doc.name,
              documentType: doc.type,
              status: doc.status,
              arrivalTime: visit.arrivalTime,
              departureTime: visit.departureTime,
              processingTimeHours: processingTimeHours,
              processingTimeFormatted: formatHours(processingTimeHours),
              expectedHours: expectedHours,
              isDelayed: isDelayed,
              delayHours: delayHours,
              delayFormatted: delayHours > 0 ? formatHours(delayHours) : null,
              submittedBy: doc.submittedBy
            });
          }
        } else if (visit.arrivalTime) {
          const currentTime = new Date();
          const processingTimeHours = (currentTime - visit.arrivalTime) / (1000 * 60 * 60);
          const expectedHours = doc.expectedProcessingTime || 24;
          const isDelayed = processingTimeHours > expectedHours;
          const delayHours = isDelayed ? processingTimeHours - expectedHours : 0;
          
          departmentStats[officeName].documents.push({
            documentId: doc.documentId,
            documentName: doc.name,
            documentType: doc.type,
            status: doc.status,
            arrivalTime: visit.arrivalTime,
            departureTime: null,
            processingTimeHours: processingTimeHours,
            processingTimeFormatted: formatHours(processingTimeHours),
            expectedHours: expectedHours,
            isDelayed: isDelayed,
            delayHours: delayHours,
            delayFormatted: delayHours > 0 ? formatHours(delayHours) : null,
            submittedBy: doc.submittedBy,
            inProgress: true
          });
        }
      });
    });
    
    Object.keys(departmentStats).forEach(dept => {
      const stats = departmentStats[dept];
      stats.totalDocuments = stats.documents ? stats.documents.length : (stats.documentIds ? stats.documentIds.size : 0);
      
      if (stats.totalProcessingTimes.length > 0) {
        const times = stats.totalProcessingTimes;
        stats.averageHours = times.reduce((sum, t) => sum + t, 0) / times.length;
        stats.minHours = Math.min(...times);
        stats.maxHours = Math.max(...times);
        stats.averageFormatted = formatHours(stats.averageHours);
        stats.minFormatted = formatHours(stats.minHours);
        stats.maxFormatted = formatHours(stats.maxHours);
      } else {
        stats.averageFormatted = 'N/A';
        stats.minFormatted = 'N/A';
        stats.maxFormatted = 'N/A';
      }
      
      if (!stats.documents) {
        stats.documents = [];
      }
      delete stats.documentIds;
    });
    
    Object.keys(departmentStats).forEach(dept => {
      if (departmentStats[dept].documents) {
        departmentStats[dept].documents.sort((a, b) => 
          new Date(b.arrivalTime) - new Date(a.arrivalTime)
        );
      }
    });
    
    return Object.values(departmentStats)
      .filter(dept => (dept.documents && dept.documents.length > 0) || dept.completedDocuments > 0)
      .sort((a, b) => a.averageHours - b.averageHours);
  };

  const downloadDepartmentApprovalTimesReport = () => {
    const doc = new jsPDF();
    const departmentApprovalTimes = getDepartmentApprovalTimes();
    
    doc.setFontSize(18);
    doc.text('Department Approval Time Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    
    if (departmentApprovalTimes.length === 0) {
      doc.setFontSize(12);
      doc.text('No approval time data available.', 14, 40);
      doc.save('Department_Approval_Times_Report.pdf');
      return;
    }
    
    const tableData = departmentApprovalTimes.map(dept => [
      dept.department,
      dept.completedDocuments.toString(),
      dept.averageFormatted,
      dept.minFormatted,
      dept.maxFormatted
    ]);
    
    doc.autoTable({
      head: [['Department/Office', 'Documents Processed', 'Average Time', 'Fastest', 'Slowest']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [111, 66, 193] },
      styles: { fontSize: 9 }
    });
    
    doc.save('Department_Approval_Times_Report.pdf');
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


      {/* Department Approval Times Report */}
      {(() => {
        const departmentApprovalTimes = getDepartmentApprovalTimes();
        return (
          <div style={{ marginBottom: '30px' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>Department Approval Time Report</h3>
                <button
                  onClick={() => downloadDepartmentApprovalTimesReport()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                >
                  Download PDF
                </button>
              </div>
              
              {departmentApprovalTimes.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                  No approval time data available. Documents need to complete their routing workflow to generate statistics.
                </div>
              ) : (
                <div>
                  {departmentApprovalTimes.map((dept) => {
                    const isExpanded = expandedDeptApproval.has(dept.department);
                    const deptDocuments = dept.documents || [];
                    
                    return (
                      <div key={dept.department} style={{ 
                        marginBottom: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: 'white'
                      }}>
                        <div
                          onClick={() => toggleDeptApproval(dept.department)}
                          style={{
                            padding: '15px',
                            backgroundColor: isExpanded ? '#f3e5f5' : '#f8f9fa',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isExpanded) e.currentTarget.style.backgroundColor = '#e9ecef';
                          }}
                          onMouseLeave={(e) => {
                            if (!isExpanded) e.currentTarget.style.backgroundColor = '#f8f9fa';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                              {isExpanded ? '▼' : '▶'}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '15px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                                {dept.department}
                              </div>
                              <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#6c757d' }}>
                                <span>Avg: {dept.averageFormatted}</span>
                                <span style={{ color: '#28a745' }}>Fastest: {dept.minFormatted}</span>
                                <span style={{ color: '#dc3545' }}>Slowest: {dept.maxFormatted}</span>
                              </div>
                            </div>
                          </div>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: '600',
                            backgroundColor: '#f3e5f5',
                            color: '#7b1fa2'
                          }}>
                            {dept.totalDocuments || dept.completedDocuments} {(dept.totalDocuments || dept.completedDocuments) === 1 ? 'Document' : 'Documents'}
                          </span>
                        </div>
                        
                        {isExpanded && (
                          <div style={{ padding: '15px', borderTop: '1px solid #ddd', backgroundColor: '#fafafa' }}>
                            {deptDocuments.length > 0 ? (
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50', marginBottom: '12px' }}>
                                  Document Details & Delay Analysis
                                </div>
                                {deptDocuments.map((docItem, docIndex) => (
                                  <div key={docItem.documentId} style={{
                                    padding: '12px',
                                    backgroundColor: docIndex % 2 === 0 ? '#ffffff' : '#f8f9fa',
                                    borderRadius: '6px',
                                    marginBottom: '8px',
                                    border: docItem.isDelayed ? '2px solid #dc3545' : '1px solid #e0e0e0'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                                          {docItem.documentName}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '4px' }}>
                                          ID: {docItem.documentId} • Type: {docItem.documentType}
                                        </div>
                                        {docItem.submittedBy && (
                                          <div style={{ fontSize: '11px', color: '#6c757d' }}>
                                            Submitted by: {docItem.submittedBy}
                                          </div>
                                        )}
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        {docItem.inProgress && (
                                          <span style={{
                                            padding: '3px 8px',
                                            borderRadius: '8px',
                                            fontSize: '10px',
                                            fontWeight: '600',
                                            backgroundColor: '#fff3cd',
                                            color: '#856404'
                                          }}>
                                            In Progress
                                          </span>
                                        )}
                                        <span style={{
                                          padding: '3px 8px',
                                          borderRadius: '8px',
                                          fontSize: '11px',
                                          fontWeight: '600',
                                          backgroundColor: docItem.isDelayed ? '#f8d7da' : '#d4edda',
                                          color: docItem.isDelayed ? '#721c24' : '#155724'
                                        }}>
                                          {docItem.status || 'Processing'}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div style={{ 
                                      display: 'grid', 
                                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                                      gap: '10px',
                                      marginTop: '8px',
                                      paddingTop: '8px',
                                      borderTop: '1px solid #e0e0e0'
                                    }}>
                                      <div>
                                        <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '2px' }}>Processing Time</div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                                          {docItem.processingTimeFormatted}
                                        </div>
                                      </div>
                                      <div>
                                        <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '2px' }}>Expected Time</div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                                          {formatHours(docItem.expectedHours)}
                                        </div>
                                      </div>
                                      {docItem.departureTime ? (
                                        <div>
                                          <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '2px' }}>Completed</div>
                                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#28a745' }}>
                                            {new Date(docItem.departureTime).toLocaleDateString()}
                                          </div>
                                        </div>
                                      ) : (
                                        <div>
                                          <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '2px' }}>Arrived</div>
                                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffc107' }}>
                                            {new Date(docItem.arrivalTime).toLocaleDateString()}
                                          </div>
                                        </div>
                                      )}
                                      {docItem.isDelayed && docItem.delayFormatted && (
                                        <div>
                                          <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '2px' }}>Delay</div>
                                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#dc3545' }}>
                                            {docItem.delayFormatted} ⚠️
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d', fontSize: '14px' }}>
                                No document details available
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}


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

