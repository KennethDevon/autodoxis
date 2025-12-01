import React, { useState } from 'react';
import API_URL from './config';

function Signup({ onSignup, onShowLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username && email && password) {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, password }),
        });
        const data = await response.json();
        if (response.ok) {
          alert(data.message);
          onSignup(true); // Indicate successful signup/redirection to login
        } else {
          alert(data.message || 'Registration failed');
        }
      } catch (error) {
        console.error('Registration failed:', error);
        alert('Registration failed due to network error');
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('Please fill in all fields');
    }
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
        maxWidth: '400px',
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
            Create Account
          </h1>
          <p style={{
            color: '#95a5a6',
            fontSize: '14px',
            margin: 0
          }}>
            Join us and start managing your data
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Full Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ 
                width: '100%',
                padding: '15px 20px',
                border: '2px solid #ecf0f1',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ 
                width: '100%',
                padding: '15px 20px',
                border: '2px solid #ecf0f1',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
            />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                width: '100%',
                padding: '15px 20px',
                border: '2px solid #ecf0f1',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: '100%',
              padding: '15px',
              background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              opacity: isLoading ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 10px 20px rgba(46, 204, 113, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '30px 0',
          color: '#bdc3c7'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#ecf0f1' }}></div>
          <span style={{ padding: '0 20px', fontSize: '14px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#ecf0f1' }}></div>
        </div>

        {/* Login Link */}
        <p style={{ 
          color: '#7f8c8d',
          fontSize: '14px',
          margin: 0
        }}>
          Already have an account?{' '}
          <button
            onClick={onShowLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#3498db',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'underline'
            }}
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;
