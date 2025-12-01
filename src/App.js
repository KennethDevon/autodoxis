import React, { useState } from 'react';
import './App.css';
import Aboard from './aboard';
import Edashboard from './edashboard';
import Login from './Login';
import Signup from './Signup';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [dashboardType, setDashboardType] = useState('Dashboard');
  const [userRole, setUserRole] = useState('');

  const handleLogin = (status, dashboard = 'Dashboard', role = '') => {
    setIsLoggedIn(status);
    setDashboardType(dashboard);
    setUserRole(role);
    setShowSignup(false); // Hide signup if login is successful
  };

  const handleSignup = (status) => {
    if (status) {
      setShowSignup(false); // After signup, go back to login
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setDashboardType('Dashboard'); // Reset to default dashboard
    setUserRole('');
  };

  // Render appropriate dashboard based on role
  const renderDashboard = () => {
    switch (dashboardType) {
      // Admin Dashboard
      case 'Admin':
        return <Aboard onLogout={handleLogout} />;
      
      // Staff Dashboard
      case 'Staff':
        return <Edashboard onLogout={handleLogout} />;
      
      // User Dashboard
      case 'User':
        return <Edashboard onLogout={handleLogout} />;
      
      // Default fallback
      default:
        return <Aboard onLogout={handleLogout} />;
    }
  };

  if (isLoggedIn) {
    return (
      <div className="App">
        {renderDashboard()}
      </div>
    );
  }

  if (showSignup) {
    return <Signup onSignup={handleSignup} onShowLogin={() => setShowSignup(false)} />;
  }

  return <Login onLogin={handleLogin} onShowSignup={() => setShowSignup(true)} />;
}

export default App;
