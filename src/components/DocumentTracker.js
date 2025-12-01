import React, { useState, useEffect } from 'react';
import API_URL from '../config';

function DocumentTracker({ documentId, documentName, onClose }) {
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newScan, setNewScan] = useState({
    scannedBy: '',
    location: '',
    action: 'viewed'
  });

  useEffect(() => {
    const fetchScanHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/documents/${documentId}/scan-history`);
        
        if (response.ok) {
          const data = await response.json();
          setScanHistory(data.scanHistory || []);
        } else {
          setError('Failed to fetch scan history');
        }
      } catch (err) {
        setError('Error fetching scan history');
        console.error('Error fetching scan history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchScanHistory();
  }, [documentId]);

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newScan),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh scan history
        const historyResponse = await fetch(`${API_URL}/documents/${documentId}/scan-history`);
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setScanHistory(historyData.scanHistory || []);
        }
        
        // Reset form
        setNewScan({
          scannedBy: '',
          location: '',
          action: 'viewed'
        });
        
        alert('Scan recorded successfully!');
      } else {
        alert('Failed to record scan');
      }
    } catch (err) {
      console.error('Error recording scan:', err);
      alert('Error recording scan');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewScan(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div>Loading scan history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>
          <button onClick={onClose} style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
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
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        width: '800px',
        maxWidth: '90%',
        maxHeight: '90%',
        overflow: 'auto'
      }}>
        <h3 style={{ marginTop: 0 }}>Document Tracking - {documentName}</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <strong>Document ID:</strong> {documentId}
        </div>

        {/* Add New Scan Form */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ marginTop: 0 }}>Record New Scan</h4>
          <form onSubmit={handleScanSubmit}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                name="scannedBy"
                placeholder="Scanned by"
                value={newScan.scannedBy}
                onChange={handleInputChange}
                required
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  flex: 1
                }}
              />
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={newScan.location}
                onChange={handleInputChange}
                required
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  flex: 1
                }}
              />
              <select
                name="action"
                value={newScan.action}
                onChange={handleInputChange}
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="viewed">Viewed</option>
                <option value="downloaded">Downloaded</option>
                <option value="printed">Printed</option>
                <option value="transferred">Transferred</option>
              </select>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Record Scan
              </button>
            </div>
          </form>
        </div>

        {/* Scan History */}
        <div>
          <h4>Scan History ({scanHistory.length} entries)</h4>
          {scanHistory.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#6c757d',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px'
            }}>
              No scan history available
            </div>
          ) : (
            <div style={{
              maxHeight: '300px',
              overflow: 'auto',
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left' }}>Date/Time</th>
                    <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left' }}>Scanned By</th>
                    <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left' }}>Location</th>
                    <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {scanHistory.map((scan, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>
                        {new Date(scan.scannedAt).toLocaleString()}
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>
                        {scan.scannedBy}
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>
                        {scan.location}
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          backgroundColor: 
                            scan.action === 'viewed' ? '#e3f2fd' :
                            scan.action === 'downloaded' ? '#e8f5e8' :
                            scan.action === 'printed' ? '#fff3e0' :
                            scan.action === 'transferred' ? '#f3e5f5' : '#f5f5f5',
                          color: 
                            scan.action === 'viewed' ? '#1976d2' :
                            scan.action === 'downloaded' ? '#388e3c' :
                            scan.action === 'printed' ? '#f57c00' :
                            scan.action === 'transferred' ? '#7b1fa2' : '#666'
                        }}>
                          {scan.action.charAt(0).toUpperCase() + scan.action.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentTracker;
