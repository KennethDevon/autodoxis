import React, { useState } from 'react';
import Modal from './Modal';
import EmailVerification from './EmailVerification';
import API_URL from './config';

function Login({ onLogin, onShowSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [showVerification, setShowVerification] = useState(false);
  const [verificationData, setVerificationData] = useState(null);

  // Helper function to show modal
  const showModal = (title, message, type = 'info') => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: '', message: '', type: 'info' });
  };

  const handleVerificationSuccess = (user) => {
    // Store user data in localStorage
    localStorage.setItem('userData', JSON.stringify(user));
    
    // Handle role-based routing
    const userRole = user?.role || '';
    const userEmail = user?.email || email;
    
    // sadmin@gmail.com always gets Admin access
    if (userEmail === 'sadmin@gmail.com') {
      const adminUser = { ...user, role: 'Admin' };
      localStorage.setItem('userData', JSON.stringify(adminUser));
      onLogin(true, 'Admin', 'Admin');
    } else {
      switch (userRole) {
        case 'Admin':
          onLogin(true, 'Admin', userRole);
          break;
        case 'Staff':
          onLogin(true, 'Staff', userRole);
          break;
        case 'User':
          onLogin(true, 'User', userRole);
          break;
        default:
          onLogin(true, 'User', 'User');
          break;
      }
    }
  };

  const handleVerificationCancel = () => {
    setShowVerification(false);
    setVerificationData(null);
    setEmail('');
    setPassword('');
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && password) {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (response.ok) {
          // Check if email verification is required (for admin users)
          if (data.requiresVerification) {
            setVerificationData({
              userId: data.userId,
              email: data.email
            });
            setShowVerification(true);
            return;
          }

          // Store user data in localStorage
          localStorage.setItem('userData', JSON.stringify(data.user));
          
          // Handle role-based routing
          const userRole = data.user?.role || '';
          const userEmail = data.user?.email || email;
          
          // sadmin@gmail.com always gets Admin access
          if (userEmail === 'sadmin@gmail.com') {
            // Force Admin role for sadmin@gmail.com regardless of database role
            const adminUser = { ...data.user, role: 'Admin' };
            localStorage.setItem('userData', JSON.stringify(adminUser));
            onLogin(true, 'Admin', 'Admin');
          } else {
            // Role-based routing
            switch (userRole) {
              // Admin Role
              case 'Admin':
                onLogin(true, 'Admin', userRole);
                break;
              
              // Staff Role
              case 'Staff':
                onLogin(true, 'Staff', userRole);
                break;
              
              // User Role
              case 'User':
                onLogin(true, 'User', userRole);
                break;
              
              // Default fallback
              default:
                onLogin(true, 'User', 'User');
                break;
            }
          }
        } else {
          showModal('Login Failed', data.message || 'Login failed', 'error');
        }
      } catch (error) {
        console.error('Login failed:', error);
        showModal('Network Error', 'Login failed due to network error', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      showModal('Missing Information', 'Please enter email and password', 'warning');
    }
  };

  // Show verification screen if needed
  if (showVerification && verificationData) {
    return (
      <EmailVerification
        userId={verificationData.userId}
        email={verificationData.email}
        onVerificationSuccess={handleVerificationSuccess}
        onCancel={handleVerificationCancel}
      />
    );
  }

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
            Routing System
          </p>
        </div>


        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Email"
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
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
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
                e.target.style.boxShadow = '0 10px 20px rgba(52, 152, 219, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

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

export default Login;
