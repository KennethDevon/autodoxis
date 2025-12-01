import React, { useState, useEffect } from 'react';
import API_URL from '../config';

function QRCodeDisplay({ documentId, documentName, onClose }) {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/documents/${documentId}/qrcode`);
        
        if (response.ok) {
          const data = await response.json();
          setQrCodeData(data);
        } else {
          setError('Failed to generate QR code');
        }
      } catch (err) {
        setError('Error generating QR code');
        console.error('Error fetching QR code:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, [documentId]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${documentName}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .qr-container { margin: 20px 0; }
            .document-info { margin: 10px 0; font-size: 14px; }
          </style>
        </head>
        <body>
          <h2>Document QR Code</h2>
          <div class="document-info">
            <strong>Document:</strong> ${documentName}<br/>
            <strong>ID:</strong> ${documentId}<br/>
            <strong>Generated:</strong> ${new Date().toLocaleString()}
          </div>
          <div class="qr-container">
            ${qrCodeData ? `<img src="${qrCodeData.qrCode}" alt="QR Code" style="max-width: 300px;" />` : ''}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    if (qrCodeData) {
      const link = document.createElement('a');
      link.href = qrCodeData.qrCode;
      link.download = `qr-code-${documentId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
          <div>Generating QR Code...</div>
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
        width: '400px',
        maxWidth: '90%',
        textAlign: 'center'
      }}>
        <h3 style={{ marginTop: 0 }}>QR Code</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <strong>Document:</strong> {documentName}<br/>
          <strong>ID:</strong> {documentId}
        </div>

        {qrCodeData && (
          <div style={{ marginBottom: '20px' }}>
            <img 
              src={qrCodeData.qrCode} 
              alt="QR Code" 
              style={{ 
                maxWidth: '250px', 
                height: 'auto',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }} 
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
          <button
            onClick={handleDownload}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📥 Download
          </button>
          <button
            onClick={handlePrint}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🖨️ Print
          </button>
        </div>

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
  );
}

export default QRCodeDisplay;
