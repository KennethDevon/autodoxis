import React, { useState, useEffect } from 'react';
import API_URL from '../config';

function DocumentTrackingTimeline({ documentId, onClose }) {
  const [trackingData, setTrackingData] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (documentId) {
      fetchTrackingData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const fetchTrackingData = async () => {
    try {
      // Get routing history
      const historyResponse = await fetch(`${API_URL}/documents/${documentId}/routing-history`);
      const historyData = await historyResponse.json();
      
      // Get current location
      const locationResponse = await fetch(`${API_URL}/documents/${documentId}/current-location`);
      const locData = await locationResponse.json();
      
      setTrackingData(historyData);
      setLocationData(locData);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'received':
        return '📥';
      case 'reviewed':
        return '👁️';
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'forwarded':
        return '📤';
      case 'on_hold':
        return '⏸️';
      case 'returned':
        return '↩️';
      default:
        return '📄';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'approved':
        return { bg: '#e8f5e8', color: '#388e3c' };
      case 'rejected':
        return { bg: '#ffe8e8', color: '#d32f2f' };
      case 'forwarded':
        return { bg: '#e3f2fd', color: '#1976d2' };
      case 'on_hold':
        return { bg: '#fff3cd', color: '#f39c12' };
      case 'returned':
        return { bg: '#fce4ec', color: '#c2185b' };
      default:
        return { bg: '#f8f9fa', color: '#2c3e50' };
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '15px',
          textAlign: 'center',
          fontSize: '18px',
          color: '#7f8c8d'
        }}>
          Loading tracking information...
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#e74c3c', fontSize: '18px', marginBottom: '20px' }}>
            Unable to load tracking data
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3000,
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '30px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px',
          borderBottom: '2px solid #f1f3f4',
          paddingBottom: '15px'
        }}>
          <div>
            <h2 style={{
              margin: '0 0 5px 0',
              fontSize: '24px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              📍 Document Tracking
            </h2>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#7f8c8d'
            }}>
              {trackingData.documentId} - {trackingData.documentName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#95a5a6',
              padding: '5px 10px',
              borderRadius: '50%',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.color = '#e74c3c';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#95a5a6';
            }}
          >
            ×
          </button>
        </div>

        {/* Current Status Card */}
        {locationData && (
          <div style={{
            backgroundColor: trackingData.isDelayed ? '#fff3cd' : '#e8f5e8',
            border: `2px solid ${trackingData.isDelayed ? '#ffeaa7' : '#c8e6c9'}`,
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '25px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              <div>
                <p style={{
                  margin: '0 0 5px 0',
                  fontSize: '12px',
                  color: '#7f8c8d',
                  textTransform: 'uppercase',
                  fontWeight: '600'
                }}>
                  Current Location
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '16px',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  {locationData.lastKnownLocation}
                </p>
              </div>
              <div>
                <p style={{
                  margin: '0 0 5px 0',
                  fontSize: '12px',
                  color: '#7f8c8d',
                  textTransform: 'uppercase',
                  fontWeight: '600'
                }}>
                  Status
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '16px',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  {locationData.status}
                </p>
              </div>
              <div>
                <p style={{
                  margin: '0 0 5px 0',
                  fontSize: '12px',
                  color: '#7f8c8d',
                  textTransform: 'uppercase',
                  fontWeight: '600'
                }}>
                  Last Handler
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '16px',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  {locationData.lastHandler}
                </p>
              </div>
              {trackingData.isDelayed && (
                <div>
                  <p style={{
                    margin: '0 0 5px 0',
                    fontSize: '12px',
                    color: '#f39c12',
                    textTransform: 'uppercase',
                    fontWeight: '600'
                  }}>
                    ⚠️ Delayed
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '16px',
                    color: '#f39c12',
                    fontWeight: '600'
                  }}>
                    {trackingData.delayedHours} hours
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Processing Time Summary */}
        <div style={{
          backgroundColor: '#e3f2fd',
          border: '2px solid #bbdefb',
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '25px',
          textAlign: 'center'
        }}>
          <p style={{
            margin: '0 0 5px 0',
            fontSize: '12px',
            color: '#1976d2',
            textTransform: 'uppercase',
            fontWeight: '600'
          }}>
            Total Processing Time
          </p>
          <p style={{
            margin: 0,
            fontSize: '24px',
            color: '#1976d2',
            fontWeight: 'bold'
          }}>
            {trackingData.totalProcessingTime.toFixed(1)} hours
          </p>
        </div>

        {/* Timeline */}
        <div>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#2c3e50'
          }}>
            📋 Routing History ({trackingData.routingHistory.length} events)
          </h3>

          {trackingData.routingHistory.length > 0 ? (
            <div style={{ position: 'relative' }}>
              {/* Timeline Line */}
              <div style={{
                position: 'absolute',
                left: '25px',
                top: '20px',
                bottom: '20px',
                width: '3px',
                backgroundColor: '#e1e8ed'
              }} />

              {/* Timeline Events */}
              {trackingData.routingHistory.map((entry, index) => {
                const actionStyle = getActionColor(entry.action);
                return (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      paddingLeft: '60px',
                      paddingBottom: '25px'
                    }}
                  >
                    {/* Timeline Node */}
                    <div style={{
                      position: 'absolute',
                      left: '13px',
                      top: '0',
                      width: '25px',
                      height: '25px',
                      borderRadius: '50%',
                      backgroundColor: actionStyle.bg,
                      border: `3px solid ${actionStyle.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      zIndex: 1
                    }}>
                      {getActionIcon(entry.action)}
                    </div>

                    {/* Event Card */}
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: '10px',
                      padding: '15px',
                      border: `2px solid ${actionStyle.bg}`
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '10px'
                      }}>
                        <div>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: actionStyle.bg,
                            color: actionStyle.color,
                            textTransform: 'uppercase'
                          }}>
                            {entry.action.replace('_', ' ')}
                          </span>
                          <p style={{
                            margin: '8px 0 0 0',
                            fontSize: '14px',
                            color: '#2c3e50',
                            fontWeight: '600'
                          }}>
                            {entry.office}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{
                            margin: 0,
                            fontSize: '12px',
                            color: '#7f8c8d'
                          }}>
                            {formatDate(entry.timestamp)}
                          </p>
                          {entry.processingTimeHours > 0 && (
                            <p style={{
                              margin: '5px 0 0 0',
                              fontSize: '12px',
                              color: '#1976d2',
                              fontWeight: '600'
                            }}>
                              ⏱️ {entry.processingTimeHours}h
                            </p>
                          )}
                        </div>
                      </div>

                      {entry.handler && (
                        <p style={{
                          margin: '8px 0 0 0',
                          fontSize: '13px',
                          color: '#2c3e50'
                        }}>
                          <strong>Handler:</strong> {entry.handler}
                        </p>
                      )}

                      {entry.comments && (
                        <p style={{
                          margin: '8px 0 0 0',
                          fontSize: '13px',
                          color: '#2c3e50',
                          backgroundColor: 'white',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          borderLeft: '3px solid ' + actionStyle.color
                        }}>
                          <strong>Comments:</strong> {entry.comments}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{
              textAlign: 'center',
              color: '#95a5a6',
              fontSize: '16px',
              padding: '40px'
            }}>
              No routing history available for this document.
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          marginTop: '25px',
          borderTop: '2px solid #f1f3f4',
          paddingTop: '20px',
          textAlign: 'right'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentTrackingTimeline;

