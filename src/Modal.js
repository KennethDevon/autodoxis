import React from 'react';

function Modal({ isOpen, onClose, title, message, type = 'info', showCancel = false, onConfirm }) {
  if (!isOpen) return null;

  const getModalStyles = () => {
    const baseStyles = {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    };

    return baseStyles;
  };

  const getContentStyles = () => {
    const baseStyles = {
      backgroundColor: 'white',
      borderRadius: '15px',
      padding: '30px',
      maxWidth: '400px',
      width: '90%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      textAlign: 'center'
    };

    return baseStyles;
  };

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: '✅', color: '#27ae60' };
      case 'error':
        return { icon: '❌', color: '#e74c3c' };
      case 'warning':
        return { icon: '⚠️', color: '#f39c12' };
      case 'info':
      default:
        return { icon: 'ℹ️', color: '#3498db' };
    }
  };

  const { icon, color } = getIconAndColor();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div style={getModalStyles()}>
      <div style={getContentStyles()}>
        {/* Icon */}
        <div style={{ fontSize: '3em', marginBottom: '20px' }}>
          {icon}
        </div>

        {/* Title */}
        {title && (
          <h3 style={{
            margin: '0 0 15px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#2c3e50'
          }}>
            {title}
          </h3>
        )}

        {/* Message */}
        <p style={{
          margin: '0 0 25px 0',
          fontSize: '16px',
          color: '#7f8c8d',
          lineHeight: '1.5'
        }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center'
        }}>
          {showCancel && (
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#7f8c8d'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#95a5a6'}
            >
              Cancel
            </button>
          )}
          <button
            onClick={showCancel ? handleConfirm : onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: color,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => {
              const hoverColor = type === 'success' ? '#229954' :
                                type === 'error' ? '#c0392b' :
                                type === 'warning' ? '#e67e22' : '#2980b9';
              e.target.style.backgroundColor = hoverColor;
            }}
            onMouseLeave={(e) => e.target.style.backgroundColor = color}
          >
            {showCancel ? 'Confirm' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
