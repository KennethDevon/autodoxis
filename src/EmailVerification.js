import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import API_URL from './config';

function EmailVerification({ userId, email, onVerificationSuccess, onCancel }) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, code }),
      });

      const data = await response.json();

      if (response.ok) {
        // Verification successful
        onVerificationSuccess(data.user);
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/resend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setModal({
          isOpen: true,
          title: 'Code Resent',
          message: 'A new verification code has been sent to your email.',
          type: 'success'
        });
        setTimeLeft(600); // Reset timer
        setCode(''); // Clear input
      } else {
        setError(data.message || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: '', message: '', type: 'info' });
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        padding: '50px 40px',
        width: '100%',
        maxWidth: '450px',
        textAlign: 'center'
      }}>
        {/* Logo/Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '32px',
            fontWeight: '700',
            color: '#2c3e50',
            margin: '0 0 10px 0'
          }}>
            Autodoxis
          </h1>
          <p style={{
            color: '#7f8c8d',
            fontSize: '16px',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: '500'
          }}>
            Email Verification
          </p>
        </div>

        {/* Info Message */}
        <div style={{
          background: '#e8f4f8',
          border: '1px solid #3498db',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <p style={{ 
            color: '#2c3e50',
            fontSize: '14px',
            margin: '0 0 10px 0',
            lineHeight: '1.6'
          }}>
            We've sent a 6-digit verification code to:
          </p>
          <p style={{ 
            color: '#3498db',
            fontSize: '16px',
            fontWeight: '600',
            margin: 0
          }}>
            {email}
          </p>
        </div>

        {/* Timer */}
        {timeLeft > 0 && (
          <div style={{
            color: '#7f8c8d',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            Code expires in: <strong style={{ color: '#e74c3c' }}>{formatTime(timeLeft)}</strong>
          </div>
        )}

        {timeLeft === 0 && (
          <div style={{
            background: '#fee',
            border: '1px solid #e74c3c',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            color: '#e74c3c',
            fontSize: '14px'
          }}>
            Verification code has expired. Please request a new one.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              textAlign: 'left',
              marginBottom: '8px',
              color: '#2c3e50',
              fontWeight: '500',
              fontSize: '14px'
            }}>
              Enter Verification Code
            </label>
            <input
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
                setError('');
              }}
              maxLength={6}
              style={{ 
                width: '100%',
                padding: '15px 20px',
                border: error ? '2px solid #e74c3c' : '2px solid #ecf0f1',
                borderRadius: '12px',
                fontSize: '24px',
                fontWeight: '600',
                textAlign: 'center',
                letterSpacing: '8px',
                fontFamily: 'monospace',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = error ? '#e74c3c' : '#ecf0f1'}
              disabled={isLoading || timeLeft === 0}
            />
            {error && (
              <p style={{
                color: '#e74c3c',
                fontSize: '12px',
                margin: '8px 0 0 0',
                textAlign: 'left'
              }}>
                {error}
              </p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isLoading || code.length !== 6 || timeLeft === 0}
            style={{ 
              width: '100%',
              padding: '15px',
              background: (isLoading || code.length !== 6 || timeLeft === 0) 
                ? '#95a5a6' 
                : 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: (isLoading || code.length !== 6 || timeLeft === 0) ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              opacity: (isLoading || code.length !== 6 || timeLeft === 0) ? 0.7 : 1,
              marginBottom: '15px'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && code.length === 6 && timeLeft > 0) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 10px 20px rgba(52, 152, 219, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && code.length === 6 && timeLeft > 0) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        {/* Resend Code */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleResendCode}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              color: '#3498db',
              fontSize: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {isLoading ? 'Sending...' : "Didn't receive the code? Resend"}
          </button>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          style={{
            background: 'none',
            border: 'none',
            color: '#7f8c8d',
            fontSize: '14px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          Cancel
        </button>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
}

export default EmailVerification;

