import React, { useState, useEffect } from 'react';
import API_URL from '../config';

function BarcodeDisplay({ documentId, documentName, onClose }) {
  const [barcodeData, setBarcodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBarcode = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/documents/${documentId}/barcode`);
        
        if (response.ok) {
          const data = await response.json();
          setBarcodeData(data);
        } else {
          setError('Failed to generate barcode');
        }
      } catch (err) {
        setError('Error generating barcode');
        console.error('Error fetching barcode:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBarcode();
  }, [documentId]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Barcode - ${documentName}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .barcode-container { margin: 20px 0; }
            .document-info { margin: 10px 0; font-size: 14px; }
          </style>
        </head>
        <body>
          <h2>Document Barcode</h2>
          <div class="document-info">
            <strong>Document:</strong> ${documentName}<br/>
            <strong>ID:</strong> ${documentId}<br/>
            <strong>Generated:</strong> ${new Date().toLocaleString()}
          </div>
          <div class="barcode-container">
            ${barcodeData ? `<img src="${barcodeData.barcode}" alt="Barcode" style="max-width: 400px;" />` : ''}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    if (barcodeData) {
      const link = document.createElement('a');
      link.href = barcodeData.barcode;
      link.download = `barcode-${documentId}.png`;
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
          <div>Generating Barcode...</div>
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
        width: '500px',
        maxWidth: '90%',
        textAlign: 'center'
      }}>
        <h3 style={{ marginTop: 0 }}>Barcode</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <strong>Document:</strong> {documentName}<br/>
          <strong>ID:</strong> {documentId}
        </div>

        {barcodeData && (
          <div style={{ marginBottom: '20px' }}>
            <img 
              src={barcodeData.barcode} 
              alt="Barcode" 
              style={{ 
                maxWidth: '100%', 
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

export default BarcodeDisplay;
