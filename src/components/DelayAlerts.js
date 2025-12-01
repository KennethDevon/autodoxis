import React, { useState, useEffect } from 'react';
import { showNotification } from './NotificationSystem';
import API_URL from '../config';

function DelayAlerts() {
  const [delayedDocuments, setDelayedDocuments] = useState([]);
  const [delayAnalytics, setDelayAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedDocuments, setExpandedDocuments] = useState(new Set());
  const [documentRoutingHistory, setDocumentRoutingHistory] = useState({});
  const [officePerformance, setOfficePerformance] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [previousDelayCount, setPreviousDelayCount] = useState(0);

  useEffect(() => {
    fetchDelayData();
    
    // Auto-refresh every 5 minutes if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchDelayData();
      }, 5 * 60 * 1000); // 5 minutes
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchDelayData = async () => {
    try {
      // Check for delays and get updated delayed documents
      const checkResponse = await fetch(`${API_URL}/documents/delays/check`);
      const checkData = await checkResponse.json();
      
      // Get delay analytics
      const analyticsResponse = await fetch(`${API_URL}/documents/analytics/delays`);
      const analyticsData = await analyticsResponse.json();
      
      // Fetch all documents for office performance analysis
      const allDocsResponse = await fetch(`${API_URL}/documents`);
      const allDocsData = await allDocsResponse.json();
      
      const newDelayedDocs = checkData.delayedDocuments || [];
      const newDelayCount = newDelayedDocs.length;
      
      // Notify if new delays are detected
      if (previousDelayCount > 0 && newDelayCount > previousDelayCount) {
        const newDelays = newDelayCount - previousDelayCount;
        showNotification('warning', 'New Delays Detected', `${newDelays} document(s) have exceeded their expected processing time.`);
      } else if (previousDelayCount > 0 && newDelayCount < previousDelayCount) {
        const resolvedDelays = previousDelayCount - newDelayCount;
        showNotification('success', 'Delays Resolved', `${resolvedDelays} document(s) are no longer delayed.`);
      } else if (previousDelayCount === 0 && newDelayCount > 0) {
        showNotification('error', 'Delays Detected', `${newDelayCount} document(s) are currently delayed. Action required.`);
      }
      
      setPreviousDelayCount(newDelayCount);
      setDelayedDocuments(newDelayedDocs);
      setDelayAnalytics(analyticsData);
      setAllDocuments(allDocsData || []);
      
      // Fetch routing history for all delayed documents
      await fetchAllRoutingHistories(newDelayedDocs);
      
      // Calculate office performance metrics
      await calculateOfficePerformance(allDocsData || []);
    } catch (error) {
      console.error('Error fetching delay data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRoutingHistories = async (documents) => {
    const histories = {};
    for (const doc of documents) {
      try {
        const response = await fetch(`${API_URL}/documents/${doc._id}/routing-history`);
        if (response.ok) {
          const data = await response.json();
          histories[doc._id] = data;
        }
      } catch (error) {
        console.error(`Error fetching routing history for ${doc.documentId}:`, error);
      }
    }
    setDocumentRoutingHistory(histories);
  };

  const toggleDocument = (docId) => {
    const newExpanded = new Set(expandedDocuments);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedDocuments(newExpanded);
  };

  const calculateOfficePerformance = async (documents) => {
    const officeStats = {};
    
    // Collect data from all documents with routing history
    for (const doc of documents) {
      if (doc.routingHistory && doc.routingHistory.length > 0) {
        doc.routingHistory.forEach(entry => {
          const office = entry.office || 'Unknown';
          const processingTime = entry.processingTime || 0;
          
          if (!officeStats[office]) {
            officeStats[office] = {
              office: office,
              totalDocuments: 0,
              totalProcessingTime: 0,
              delayedDocuments: 0,
              onTimeDocuments: 0,
              processingTimes: []
            };
          }
          
          officeStats[office].totalDocuments++;
          officeStats[office].totalProcessingTime += processingTime;
          officeStats[office].processingTimes.push(processingTime);
          
          // Check if this stage was delayed (assuming 24h expected time)
          if (processingTime > 24) {
            officeStats[office].delayedDocuments++;
          } else {
            officeStats[office].onTimeDocuments++;
          }
        });
      }
    }
    
    // Calculate averages and rates
    const performanceData = Object.values(officeStats).map(stats => {
      const avgProcessingTime = stats.totalDocuments > 0 
        ? stats.totalProcessingTime / stats.totalDocuments 
        : 0;
      
      const delayRate = stats.totalDocuments > 0
        ? (stats.delayedDocuments / stats.totalDocuments) * 100
        : 0;
      
      const onTimeRate = stats.totalDocuments > 0
        ? (stats.onTimeDocuments / stats.totalDocuments) * 100
        : 0;
      
      // Calculate median processing time
      const sortedTimes = [...stats.processingTimes].sort((a, b) => a - b);
      const median = sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length / 2)]
        : 0;
      
      // Determine if this is a bottleneck (avg > 24h or delay rate > 30%)
      const isBottleneck = avgProcessingTime > 24 || delayRate > 30;
      
      return {
        office: stats.office,
        totalDocuments: stats.totalDocuments,
        avgProcessingTime: Math.round(avgProcessingTime * 10) / 10,
        medianProcessingTime: Math.round(median * 10) / 10,
        delayedDocuments: stats.delayedDocuments,
        onTimeDocuments: stats.onTimeDocuments,
        delayRate: Math.round(delayRate * 10) / 10,
        onTimeRate: Math.round(onTimeRate * 10) / 10,
        isBottleneck: isBottleneck,
        performance: avgProcessingTime <= 12 ? 'Excellent' :
                    avgProcessingTime <= 24 ? 'Good' :
                    avgProcessingTime <= 48 ? 'Fair' : 'Poor'
      };
    });
    
    // Sort by average processing time (slowest first to identify bottlenecks)
    performanceData.sort((a, b) => b.avgProcessingTime - a.avgProcessingTime);
    
    setOfficePerformance(performanceData);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return { bg: '#ffe8e8', color: '#d32f2f' };
      case 'High':
        return { bg: '#fff3cd', color: '#f39c12' };
      case 'Normal':
        return { bg: '#e3f2fd', color: '#1976d2' };
      case 'Low':
        return { bg: '#f8f9fa', color: '#7f8c8d' };
      default:
        return { bg: '#f8f9fa', color: '#7f8c8d' };
    }
  };

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        fontSize: '18px',
        color: '#7f8c8d'
      }}>
        Loading delay alerts...
      </div>
    );
  }

  return (
    <div>
      {/* Header with Auto-Refresh Toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        marginRight: '40px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '600',
          color: '#2c3e50',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          Delay Alerts & Analytics
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            color: '#2c3e50',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ transform: 'scale(0.9)' }}
            />
            Auto-refresh (5 min)
          </label>
          <button
            onClick={fetchDelayData}
            style={{
              padding: '4px 10px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {delayAnalytics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffe8e8',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #f5c6cb',
            textAlign: 'center'
          }}>
            <h3 style={{
              margin: '0 0 6px 0',
              color: '#d32f2f',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              Total Delayed
            </h3>
            <p style={{
              fontSize: '1.8em',
              fontWeight: 'bold',
              margin: 0,
              color: '#d32f2f'
            }}>
              {delayAnalytics.totalDelayed}
            </p>
          </div>

          <div style={{
            backgroundColor: '#fff3cd',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ffeaa7',
            textAlign: 'center'
          }}>
            <h3 style={{
              margin: '0 0 6px 0',
              color: '#f39c12',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              Total Delayed Hours
            </h3>
            <p style={{
              fontSize: '1.8em',
              fontWeight: 'bold',
              margin: 0,
              color: '#f39c12'
            }}>
              {delayAnalytics.totalDelayedHours}h
            </p>
          </div>

          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #bbdefb',
            textAlign: 'center'
          }}>
            <h3 style={{
              margin: '0 0 6px 0',
              color: '#1976d2',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              Average Delay
            </h3>
            <p style={{
              fontSize: '1.8em',
              fontWeight: 'bold',
              margin: 0,
              color: '#1976d2'
            }}>
              {delayAnalytics.averageDelayHours}h
            </p>
          </div>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #e1e8ed',
            textAlign: 'center'
          }}>
            <h3 style={{
              margin: '0 0 6px 0',
              color: '#2c3e50',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              Urgent Delayed
            </h3>
            <p style={{
              fontSize: '1.8em',
              fontWeight: 'bold',
              margin: 0,
              color: '#2c3e50'
            }}>
              {delayAnalytics.delaysByPriority.Urgent}
            </p>
          </div>
        </div>
      )}

      {/* Office Processing Speed & Bottleneck Analysis */}
      {officePerformance.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '15px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef',
          marginBottom: '15px'
        }}>
          <h3 style={{
            margin: '0 0 6px 0',
            fontSize: '15px',
            fontWeight: '600',
            color: '#2c3e50',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Office Processing Speed & Bottleneck Analysis
          </h3>
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '11px',
            color: '#7f8c8d',
            fontStyle: 'italic'
          }}>
            Identifies offices with slow processing speeds and bottlenecks
          </p>

          {/* Summary Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
            marginBottom: '12px'
          }}>
            <div style={{
              backgroundColor: '#ffe8e8',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #f5c6cb',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '10px', color: '#d32f2f', marginBottom: '4px', fontWeight: '600' }}>
                Bottlenecks Identified
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d32f2f' }}>
                {officePerformance.filter(o => o.isBottleneck).length}
              </div>
            </div>
            <div style={{
              backgroundColor: '#e8f5e8',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #c3e6cb',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '10px', color: '#388e3c', marginBottom: '4px', fontWeight: '600' }}>
                Performing Well
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#388e3c' }}>
                {officePerformance.filter(o => !o.isBottleneck).length}
              </div>
            </div>
            <div style={{
              backgroundColor: '#e3f2fd',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #bbdefb',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '10px', color: '#1976d2', marginBottom: '4px', fontWeight: '600' }}>
                Total Offices Analyzed
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2' }}>
                {officePerformance.length}
              </div>
            </div>
            <div style={{
              backgroundColor: '#fff3cd',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ffeaa7',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '10px', color: '#f39c12', marginBottom: '4px', fontWeight: '600' }}>
                Avg Processing Time
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f39c12' }}>
                {officePerformance.length > 0 
                  ? Math.round((officePerformance.reduce((sum, o) => sum + o.avgProcessingTime, 0) / officePerformance.length) * 10) / 10
                  : 0}h
              </div>
            </div>
          </div>

          {/* Detailed Office Performance Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'left',
                    backgroundColor: '#2c3e50',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    Office
                  </th>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'center',
                    backgroundColor: '#2c3e50',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    Docs
                  </th>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'center',
                    backgroundColor: '#2c3e50',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    Avg (h)
                  </th>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'center',
                    backgroundColor: '#2c3e50',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    Median (h)
                  </th>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'center',
                    backgroundColor: '#2c3e50',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    On-Time
                  </th>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'center',
                    backgroundColor: '#2c3e50',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    Delay
                  </th>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'center',
                    backgroundColor: '#2c3e50',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    Rating
                  </th>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'center',
                    backgroundColor: '#2c3e50',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {officePerformance.map((office, index) => (
                  <tr key={index} style={{
                    backgroundColor: office.isBottleneck ? '#fff5f5' : 
                                    office.performance === 'Excellent' ? '#f0f9ff' : 'white'
                  }}>
                    <td style={{
                      border: '1px solid #ddd',
                      padding: '8px 6px',
                      fontSize: '12px',
                      color: '#2c3e50',
                      fontWeight: '500'
                    }}>
                      {office.office}
                    </td>
                    <td style={{
                      border: '1px solid #ddd',
                      padding: '8px 6px',
                      textAlign: 'center',
                      fontSize: '11px',
                      color: '#2c3e50'
                      }}>
                        <div style={{ fontWeight: '600', fontSize: '12px' }}>{office.totalDocuments}</div>
                        <div style={{ fontSize: '9px', color: '#7f8c8d' }}>
                          OK: {office.onTimeDocuments} | Delayed: {office.delayedDocuments}
                        </div>
                      </td>
                    <td style={{
                      border: '1px solid #ddd',
                      padding: '8px 6px',
                      textAlign: 'center'
                    }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor:
                          office.avgProcessingTime <= 12 ? '#d4edda' :
                          office.avgProcessingTime <= 24 ? '#e8f5e8' :
                          office.avgProcessingTime <= 48 ? '#fff3cd' :
                          '#ffe8e8',
                        color:
                          office.avgProcessingTime <= 12 ? '#155724' :
                          office.avgProcessingTime <= 24 ? '#388e3c' :
                          office.avgProcessingTime <= 48 ? '#f39c12' :
                          '#d32f2f'
                      }}>
                        {office.avgProcessingTime}h
                      </span>
                    </td>
                    <td style={{
                      border: '1px solid #ddd',
                      padding: '8px 6px',
                      textAlign: 'center',
                      fontSize: '11px',
                      color: '#2c3e50',
                      fontWeight: '500'
                    }}>
                      {office.medianProcessingTime}h
                    </td>
                    <td style={{
                      border: '1px solid #ddd',
                      padding: '8px 6px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: '600',
                          backgroundColor: office.onTimeRate >= 70 ? '#d4edda' : '#fff3cd',
                          color: office.onTimeRate >= 70 ? '#155724' : '#856404'
                        }}>
                          {office.onTimeRate}%
                        </span>
                        <div style={{
                          width: '60px',
                          height: '4px',
                          backgroundColor: '#e9ecef',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${office.onTimeRate}%`,
                            height: '100%',
                            backgroundColor: office.onTimeRate >= 70 ? '#28a745' : '#ffc107'
                          }}></div>
                        </div>
                      </div>
                    </td>
                    <td style={{
                      border: '1px solid #ddd',
                      padding: '8px 6px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: '600',
                          backgroundColor: office.delayRate >= 30 ? '#ffe8e8' : '#e8f5e8',
                          color: office.delayRate >= 30 ? '#d32f2f' : '#388e3c'
                        }}>
                          {office.delayRate}%
                        </span>
                        <div style={{
                          width: '60px',
                          height: '4px',
                          backgroundColor: '#e9ecef',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${office.delayRate}%`,
                            height: '100%',
                            backgroundColor: office.delayRate >= 30 ? '#dc3545' : '#28a745'
                          }}></div>
                        </div>
                      </div>
                    </td>
                    <td style={{
                      border: '1px solid #ddd',
                      padding: '8px 6px',
                      textAlign: 'center'
                    }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '8px',
                        fontSize: '9px',
                        fontWeight: '600',
                        backgroundColor:
                          office.performance === 'Excellent' ? '#d4edda' :
                          office.performance === 'Good' ? '#e8f5e8' :
                          office.performance === 'Fair' ? '#fff3cd' :
                          '#ffe8e8',
                        color:
                          office.performance === 'Excellent' ? '#155724' :
                          office.performance === 'Good' ? '#388e3c' :
                          office.performance === 'Fair' ? '#856404' :
                          '#721c24'
                      }}>
                        {office.performance}
                      </span>
                    </td>
                    <td style={{
                      border: '1px solid #ddd',
                      padding: '8px 6px',
                      textAlign: 'center'
                    }}>
                      {office.isBottleneck ? (
                        <span style={{
                          padding: '3px 6px',
                          borderRadius: '8px',
                          fontSize: '9px',
                          fontWeight: '600',
                          backgroundColor: '#ffe8e8',
                          color: '#d32f2f',
                          display: 'inline-block'
                        }}>
                          BOTTLENECK
                        </span>
                      ) : (
                        <span style={{
                          padding: '3px 6px',
                          borderRadius: '8px',
                          fontSize: '9px',
                          fontWeight: '600',
                          backgroundColor: '#d4edda',
                          color: '#155724',
                          display: 'inline-block'
                        }}>
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div style={{
            marginTop: '12px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            <h5 style={{
              margin: '0 0 6px 0',
              fontSize: '11px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Metrics Guide:
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px', fontSize: '10px', color: '#6c757d' }}>
              <div><strong>Avg:</strong> Avg processing time</div>
              <div><strong>Median:</strong> Middle processing value</div>
              <div><strong>On-Time:</strong> % within 24h</div>
              <div><strong>Delay:</strong> % exceeding 24h</div>
              <div><strong>Bottleneck:</strong> Avg &gt;24h OR Delay &gt;30%</div>
              <div><strong>Ratings:</strong> Excellent(&lt;12h), Good(&lt;24h), Fair(&lt;48h), Poor(&gt;48h)</div>
            </div>
          </div>
        </div>
      )}

      {/* Delays by Office */}
      {delayAnalytics && Object.keys(delayAnalytics.delaysByOffice).length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '15px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef',
          marginBottom: '15px'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '15px',
            fontWeight: '600',
            color: '#2c3e50'
          }}>
            Delays by Office Summary
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'left',
                    backgroundColor: '#f8f9fa',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Office
                  </th>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Count
                  </th>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Total (hrs)
                  </th>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Avg Delay (hrs)
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(delayAnalytics.delaysByOffice)
                  .sort((a, b) => b[1].averageDelay - a[1].averageDelay)
                  .map(([office, data]) => (
                    <tr key={office}>
                      <td style={{
                        border: '1px solid #ddd',
                        padding: '8px 6px',
                        fontSize: '12px',
                        color: '#2c3e50',
                        fontWeight: '500'
                      }}>
                        {office}
                      </td>
                      <td style={{
                        border: '1px solid #ddd',
                        padding: '8px 6px',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: '#2c3e50'
                      }}>
                        {data.count}
                      </td>
                      <td style={{
                        border: '1px solid #ddd',
                        padding: '8px 6px',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: '#2c3e50'
                      }}>
                        {data.totalDelayedHours}h
                      </td>
                      <td style={{
                        border: '1px solid #ddd',
                        padding: '8px 6px',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor:
                            data.averageDelay >= 48 ? '#ffe8e8' :
                            data.averageDelay >= 24 ? '#fff3cd' :
                            '#e8f5e8',
                          color:
                            data.averageDelay >= 48 ? '#d32f2f' :
                            data.averageDelay >= 24 ? '#f39c12' :
                            '#388e3c'
                        }}>
                          {data.averageDelay}h
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delayed Documents List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '15px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{
          margin: '0 0 12px 0',
          fontSize: '15px',
          fontWeight: '600',
          color: '#2c3e50'
        }}>
          Delayed Documents ({delayedDocuments.length})
        </h3>

        {delayedDocuments.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    width: '30px'
                  }}>
                    
                  </th>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'left',
                    backgroundColor: '#f8f9fa',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Document ID
                  </th>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'left',
                    backgroundColor: '#f8f9fa',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Name
                  </th>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'left',
                    backgroundColor: '#f8f9fa',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Type
                  </th>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'left',
                    backgroundColor: '#f8f9fa',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Current Office
                  </th>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Priority
                  </th>
                  <th style={{
                    border: '1px solid #ddd',
                    padding: '8px 6px',
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Delayed (hrs)
                  </th>
                </tr>
              </thead>
              <tbody>
                {delayedDocuments
                  .sort((a, b) => b.delayedHours - a.delayedHours)
                  .map((doc) => {
                    const priorityStyle = getPriorityColor(doc.priority);
                    const isExpanded = expandedDocuments.has(doc._id);
                    const routingData = documentRoutingHistory[doc._id];
                    
                    return (
                      <React.Fragment key={doc._id}>
                        {/* Main Row */}
                        <tr 
                          onClick={() => toggleDocument(doc._id)}
                          style={{
                            backgroundColor: doc.priority === 'Urgent' ? '#fff5f5' : 'white',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = doc.priority === 'Urgent' ? '#fff5f5' : 'white'}
                        >
                          <td style={{
                            border: '1px solid #ddd',
                            padding: '8px 6px',
                            textAlign: 'center',
                            fontSize: '12px',
                            color: '#2c3e50',
                            fontWeight: 'bold'
                          }}>
                            {isExpanded ? '▼' : '▶'}
                          </td>
                          <td style={{
                            border: '1px solid #ddd',
                            padding: '8px 6px',
                            fontSize: '11px',
                            color: '#2c3e50',
                            fontFamily: 'monospace',
                            fontWeight: '600'
                          }}>
                            {doc.documentId}
                          </td>
                          <td style={{
                            border: '1px solid #ddd',
                            padding: '8px 6px',
                            fontSize: '12px',
                            color: '#2c3e50'
                          }}>
                            {doc.name}
                          </td>
                          <td style={{
                            border: '1px solid #ddd',
                            padding: '8px 6px',
                            fontSize: '11px',
                            color: '#2c3e50'
                          }}>
                            {doc.type}
                          </td>
                          <td style={{
                            border: '1px solid #ddd',
                            padding: '8px 6px',
                            fontSize: '11px',
                            color: '#2c3e50',
                            fontWeight: '500'
                          }}>
                            {doc.currentOffice || 'N/A'}
                          </td>
                          <td style={{
                            border: '1px solid #ddd',
                            padding: '8px 6px',
                            textAlign: 'center'
                          }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '9px',
                              fontWeight: '600',
                              backgroundColor: priorityStyle.bg,
                              color: priorityStyle.color
                            }}>
                              {doc.priority || 'Normal'}
                            </span>
                          </td>
                          <td style={{
                            border: '1px solid #ddd',
                            padding: '8px 6px',
                            textAlign: 'center'
                          }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor:
                                doc.delayedHours >= 48 ? '#ffe8e8' :
                                doc.delayedHours >= 24 ? '#fff3cd' :
                                '#f8f9fa',
                              color:
                                doc.delayedHours >= 48 ? '#d32f2f' :
                                doc.delayedHours >= 24 ? '#f39c12' :
                                '#7f8c8d'
                            }}>
                              {doc.delayedHours}h
                            </span>
                          </td>
                        </tr>

                        {/* Expanded Details Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan="7" style={{
                              border: '1px solid #ddd',
                              padding: '12px',
                              backgroundColor: '#f8f9fa'
                            }}>
                              <div style={{ maxWidth: '100%' }}>
                                <h4 style={{
                                  margin: '0 0 10px 0',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#2c3e50',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  Document Analytics & Routing History
                                </h4>

                                {/* Document Summary */}
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                  gap: '8px',
                                  marginBottom: '12px'
                                }}>
                                  <div style={{
                                    backgroundColor: 'white',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd'
                                  }}>
                                    <div style={{ fontSize: '9px', color: '#7f8c8d', marginBottom: '3px' }}>Submitted By</div>
                                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#2c3e50' }}>
                                      {doc.submittedBy || 'N/A'}
                                    </div>
                                  </div>
                                  <div style={{
                                    backgroundColor: 'white',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd'
                                  }}>
                                    <div style={{ fontSize: '9px', color: '#7f8c8d', marginBottom: '3px' }}>Status</div>
                                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#2c3e50' }}>
                                      {doc.status}
                                    </div>
                                  </div>
                                  <div style={{
                                    backgroundColor: 'white',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd'
                                  }}>
                                    <div style={{ fontSize: '9px', color: '#7f8c8d', marginBottom: '3px' }}>Expected Time</div>
                                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#2c3e50' }}>
                                      {doc.expectedProcessingTime}h
                                    </div>
                                  </div>
                                  <div style={{
                                    backgroundColor: 'white',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd'
                                  }}>
                                    <div style={{ fontSize: '9px', color: '#7f8c8d', marginBottom: '3px' }}>Actual Time</div>
                                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#f39c12' }}>
                                      {doc.actualTime}h
                                    </div>
                                  </div>
                                  <div style={{
                                    backgroundColor: '#ffe8e8',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: '1px solid #f5c6cb'
                                  }}>
                                    <div style={{ fontSize: '9px', color: '#d32f2f', marginBottom: '3px', fontWeight: '600' }}>Total Delayed</div>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#d32f2f' }}>
                                      {doc.delayedHours}h
                                    </div>
                                  </div>
                                </div>

                                {/* Routing History */}
                                {routingData && routingData.routingHistory && routingData.routingHistory.length > 0 ? (
                                  <div style={{
                                    backgroundColor: 'white',
                                    borderRadius: '6px',
                                    padding: '10px',
                                    border: '1px solid #ddd'
                                  }}>
                                    <h5 style={{
                                      margin: '0 0 8px 0',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      color: '#2c3e50'
                                    }}>
                                      Routing History (Total: {routingData.totalProcessingTime?.toFixed(1)}h)
                                    </h5>
                                    <div style={{ overflowX: 'auto' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                          <tr>
                                            <th style={{
                                              border: '1px solid #ddd',
                                              padding: '6px',
                                              backgroundColor: '#f8f9fa',
                                              fontSize: '10px',
                                              textAlign: 'left'
                                            }}>Office</th>
                                            <th style={{
                                              border: '1px solid #ddd',
                                              padding: '6px',
                                              backgroundColor: '#f8f9fa',
                                              fontSize: '10px',
                                              textAlign: 'center'
                                            }}>Action</th>
                                            <th style={{
                                              border: '1px solid #ddd',
                                              padding: '6px',
                                              backgroundColor: '#f8f9fa',
                                              fontSize: '10px',
                                              textAlign: 'left'
                                            }}>Handler</th>
                                            <th style={{
                                              border: '1px solid #ddd',
                                              padding: '6px',
                                              backgroundColor: '#f8f9fa',
                                              fontSize: '10px',
                                              textAlign: 'center'
                                            }}>Timestamp</th>
                                            <th style={{
                                              border: '1px solid #ddd',
                                              padding: '6px',
                                              backgroundColor: '#f8f9fa',
                                              fontSize: '10px',
                                              textAlign: 'center'
                                            }}>Time (h)</th>
                                            <th style={{
                                              border: '1px solid #ddd',
                                              padding: '6px',
                                              backgroundColor: '#f8f9fa',
                                              fontSize: '10px',
                                              textAlign: 'left'
                                            }}>Comments</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {routingData.routingHistory.map((entry, index) => {
                                            const processingTime = entry.processingTimeHours || entry.processingTime || 0;
                                            const isDelayedStage = processingTime > doc.expectedProcessingTime;
                                            
                                            return (
                                              <tr key={index} style={{
                                                backgroundColor: isDelayedStage ? '#fff3cd' : 'white'
                                              }}>
                                                <td style={{
                                                  border: '1px solid #ddd',
                                                  padding: '6px',
                                                  fontSize: '10px',
                                                  fontWeight: '500'
                                                }}>
                                                  {entry.office || 'N/A'}
                                                </td>
                                                <td style={{
                                                  border: '1px solid #ddd',
                                                  padding: '6px',
                                                  fontSize: '9px',
                                                  textAlign: 'center'
                                                }}>
                                                  <span style={{
                                                    padding: '2px 6px',
                                                    borderRadius: '8px',
                                                    backgroundColor: 
                                                      entry.action === 'approved' ? '#d4edda' :
                                                      entry.action === 'rejected' ? '#f8d7da' :
                                                      entry.action === 'forwarded' ? '#d1ecf1' :
                                                      '#e9ecef',
                                                    fontSize: '8px',
                                                    fontWeight: '600'
                                                  }}>
                                                    {entry.action}
                                                  </span>
                                                </td>
                                                <td style={{
                                                  border: '1px solid #ddd',
                                                  padding: '6px',
                                                  fontSize: '10px'
                                                }}>
                                                  {entry.handler || 'N/A'}
                                                </td>
                                                <td style={{
                                                  border: '1px solid #ddd',
                                                  padding: '6px',
                                                  fontSize: '9px',
                                                  textAlign: 'center',
                                                  fontFamily: 'monospace'
                                                }}>
                                                  {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}
                                                </td>
                                                <td style={{
                                                  border: '1px solid #ddd',
                                                  padding: '6px',
                                                  textAlign: 'center'
                                                }}>
                                                  <span style={{
                                                    padding: '2px 6px',
                                                    borderRadius: '8px',
                                                    fontSize: '9px',
                                                    fontWeight: '600',
                                                    backgroundColor: isDelayedStage ? '#ffe8e8' : '#e8f5e8',
                                                    color: isDelayedStage ? '#d32f2f' : '#388e3c'
                                                  }}>
                                                    {processingTime.toFixed(1)}h
                                                  </span>
                                                </td>
                                                <td style={{
                                                  border: '1px solid #ddd',
                                                  padding: '6px',
                                                  fontSize: '10px',
                                                  color: '#7f8c8d',
                                                  maxWidth: '150px'
                                                }}>
                                                  {entry.comments || '-'}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{
                                    backgroundColor: 'white',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd',
                                    textAlign: 'center',
                                    color: '#7f8c8d',
                                    fontSize: '11px'
                                  }}>
                                    No routing history available
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '30px',
            color: '#388e3c',
            fontSize: '13px'
          }}>
            <p style={{ margin: 0, fontWeight: '600', fontSize: '15px' }}>
              No delayed documents!
            </p>
            <p style={{ margin: '5px 0 0 0', fontWeight: '400' }}>
              All documents are being processed on time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DelayAlerts;

