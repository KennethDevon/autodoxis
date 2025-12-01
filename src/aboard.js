import React, { useState, useEffect } from 'react';
import Employee from './Employee';
import Office from './Office';
import Document from './Document';
import Modal from './Modal';
import Reports from './Reports';
import NotificationSystem, { showNotification } from './components/NotificationSystem';
import API_URL from './config';

function Aboard({ onLogout }) {
  const [currentScreen, setCurrentScreen] = useState('Dashboard');
  const [employees, setEmployees] = useState([]);
  const [offices, setOffices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteDocumentTypeModal, setShowDeleteDocumentTypeModal] = useState(false);
  const [documentTypeToDelete, setDocumentTypeToDelete] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotificationPane, setShowNotificationPane] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success'); // 'success', 'error', or 'info'
  const [addUserModal, setAddUserModal] = useState({ isOpen: false });
  const [editUserModal, setEditUserModal] = useState({ isOpen: false });
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: '',
    employeeId: ''
  });
  const [currentUser, setCurrentUser] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [documentTypeSearch, setDocumentTypeSearch] = useState('');
  const [editingDocumentType, setEditingDocumentType] = useState(null);
  const [newDocumentType, setNewDocumentType] = useState({ 
    name: '', 
    description: '',
    dateUploaded: '',
    timeUploaded: '',
    uploadedBy: '',
    file: null
  });
  const [showAddDocumentTypeModal, setShowAddDocumentTypeModal] = useState(false);
  const [viewingDocumentType, setViewingDocumentType] = useState(null);

  useEffect(() => {
    // Get current user data from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }

    if (currentScreen === 'Dashboard') {
      fetchAllData();
    } else if (currentScreen === 'Users') {
      fetchUsers();
    } else if (currentScreen === 'DocumentList') {
      fetchDocuments();
    } else if (currentScreen === 'DocumentType') {
      fetchDocumentTypes();
      fetchDocuments();
    } else if (currentScreen === 'Reports') {
      fetchAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen]);

  // Auto-refresh documents when DocumentList screen is active
  useEffect(() => {
    if (currentScreen === 'DocumentList') {
      // Refresh immediately when screen is opened
      fetchDocuments();
      
      // Set up interval to refresh every 3 seconds while on DocumentList screen
      const interval = setInterval(() => {
        fetchDocuments();
      }, 3000); // Refresh every 3 seconds for faster updates
      
      // Cleanup interval when component unmounts or screen changes
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [employeesRes, officesRes, documentsRes] = await Promise.all([
        fetch(`${API_URL}/employees`),
        fetch(`${API_URL}/offices`),
        fetch(`${API_URL}/documents`)
      ]);

      const employeesData = await employeesRes.json();
      const officesData = await officesRes.json();
      const documentsData = await documentsRes.json();

      setEmployees(employeesData);
      setOffices(officesData);
      setDocuments(documentsData);
      
      // System notification for successful data load
      showNotification('success', 'System Update', `Data refreshed: ${employeesData.length} employees, ${officesData.length} offices, ${documentsData.length} documents`);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('error', 'System Error', 'Failed to load system data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/users`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/document-types`);
      const data = await response.json();
      setDocumentTypes(data);
    } catch (error) {
      console.error('Error fetching document types:', error);
      showModal('Error', 'Failed to fetch document types. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      // Add cache-busting timestamp and no-cache headers to ensure fresh data
      const response = await fetch(`${API_URL}/documents?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();
      setDocuments(data);
      console.log('Documents refreshed:', data.length, 'documents');
      // Log status of specific document for debugging
      const doc966549295 = data.find(d => d.documentId === 'DOC966549295');
      if (doc966549295) {
        console.log('DOC966549295 status:', doc966549295.status);
      }
      // Only show system notification on manual refresh, not auto-refresh
      // (Auto-refresh happens every 3 seconds, too frequent for notifications)
    } catch (error) {
      console.error('Error fetching documents:', error);
      showNotification('error', 'System Error', 'Failed to refresh documents. Please try again.');
    }
  };

  // Helper function to show modal
  const showModal = (title, message, type = 'info') => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: '', message: '', type: 'info' });
  };

  const openAddUserModal = () => {
    setAddUserModal({ isOpen: true });
    setNewUser({
      email: '',
      password: '',
      role: '',
      employeeId: ''
    });
  };

  const closeAddUserModal = () => {
    setAddUserModal({ isOpen: false });
    setNewUser({
      email: '',
      password: '',
      role: '',
      employeeId: ''
    });
  };

  const openEditUserModal = (user) => {
    setEditingUser(user);
    setEditUserModal({ isOpen: true });
  };

  const closeEditUserModal = () => {
    setEditUserModal({ isOpen: false });
    setEditingUser(null);
  };

  const handleUpdateUserRole = async () => {
    if (!editingUser || !editingUser.role) {
      setShowNotificationPane(true);
      setNotificationMessage('Please select a role');
      setNotificationType('error');
      setTimeout(() => setShowNotificationPane(false), 3000);
      return;
    }

    await updateUserRole(editingUser._id, editingUser.role);
    closeEditUserModal();
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      // Find the user being updated
      const user = users.find(u => u._id === userId);
      
      // Protect sadmin@gmail.com from role changes
      if (user?.email === 'sadmin@gmail.com') {
        setShowNotificationPane(true);
        setNotificationMessage('Cannot modify the Admin account role. This account is protected.');
        setNotificationType('error');
        setTimeout(() => setShowNotificationPane(false), 3000);
        return;
      }

      const response = await fetch(`${API_URL}/auth/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        // Update the local state
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user._id === userId ? { ...user, role: newRole } : user
          )
        );
        
        // Show success message
        const roleText = newRole || 'No Role';
        setShowNotificationPane(true);
        setNotificationMessage(`${user?.username} is now assigned as: ${roleText}`);
        setNotificationType('success');
        setTimeout(() => setShowNotificationPane(false), 3000);
      } else {
        setShowNotificationPane(true);
        setNotificationMessage('Failed to update role. Please try again.');
        setNotificationType('error');
        setTimeout(() => setShowNotificationPane(false), 3000);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setShowNotificationPane(true);
      setNotificationMessage('Error updating role. Please check your connection and try again.');
      setNotificationType('error');
      setTimeout(() => setShowNotificationPane(false), 3000);
    }
  };

  const roleOptions = [
    'Admin',
    'Staff',
    'User'
  ];

  // Helper function to check if current user is admin
  const isCurrentUserAdmin = () => {
    if (!currentUser) return false;
    const userRole = currentUser.role || '';
    return userRole === 'Admin' || currentUser.email === 'sadmin@gmail.com';
  };

  const handleAddUser = async () => {
    try {
      // Validate required fields
      if (!newUser.email || !newUser.password) {
        setShowNotificationPane(true);
        setNotificationMessage('Please fill in all required fields (Email, Password)');
        setNotificationType('error');
        setTimeout(() => setShowNotificationPane(false), 3000);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUser.email)) {
        setShowNotificationPane(true);
        setNotificationMessage('Please enter a valid email address');
        setNotificationType('error');
        setTimeout(() => setShowNotificationPane(false), 3000);
        return;
      }

      // Validate password length
      if (newUser.password.length < 6) {
        setShowNotificationPane(true);
        setNotificationMessage('Password must be at least 6 characters long');
        setNotificationType('error');
        setTimeout(() => setShowNotificationPane(false), 3000);
        return;
      }

      // If employeeId is provided, automatically set role to 'User'
      const finalRole = newUser.employeeId ? 'User' : (newUser.role || 'Employee');

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newUser.email.split('@')[0], // Generate username from email
          email: newUser.email,
          password: newUser.password,
          role: finalRole,
          employeeId: newUser.employeeId || null
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add the new user to the local state
        setUsers(prevUsers => [...prevUsers, result.user]);
        
        // Close the modal and show success message
        closeAddUserModal();
        setShowNotificationPane(true);
        setNotificationMessage(`User "${newUser.email}" has been successfully created!`);
        setNotificationType('success');
        setTimeout(() => setShowNotificationPane(false), 3000);
        
        // Refresh the users list
        fetchUsers();
      } else {
        const error = await response.json();
        setShowNotificationPane(true);
        setNotificationMessage(error.message || 'Failed to create user. Please try again.');
        setNotificationType('error');
        setTimeout(() => setShowNotificationPane(false), 3000);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setShowNotificationPane(true);
      setNotificationMessage('Error creating user. Please check your connection and try again.');
      setNotificationType('error');
      setTimeout(() => setShowNotificationPane(false), 3000);
    }
  };

  const handleRemoveUser = (userId, username, email) => {
    // Protect sadmin@gmail.com from deletion
    if (email === 'sadmin@gmail.com') {
      setShowNotificationPane(true);
      setNotificationMessage('Cannot delete the Admin account. This account is protected.');
      setNotificationType('error');
      setTimeout(() => setShowNotificationPane(false), 3000);
      return;
    }

    setUserToDelete({ id: userId, username, email });
    setShowDeleteUserModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`${API_URL}/auth/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove user from local state
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userToDelete.id));
        
        // Show success message
        setShowNotificationPane(true);
        setNotificationMessage(`User "${userToDelete.username}" has been successfully deleted`);
        setNotificationType('success');
        setTimeout(() => setShowNotificationPane(false), 3000);
      } else {
        const error = await response.json();
        setShowNotificationPane(true);
        setNotificationMessage(error.message || 'Failed to delete user. Please try again.');
        setNotificationType('error');
        setTimeout(() => setShowNotificationPane(false), 3000);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setShowNotificationPane(true);
      setNotificationMessage('Error deleting user. Please check your connection and try again.');
      setNotificationType('error');
      setTimeout(() => setShowNotificationPane(false), 3000);
    }
    
    setShowDeleteUserModal(false);
    setUserToDelete(null);
  };

  const cancelDeleteUser = () => {
    setShowNotificationPane(true);
    setNotificationMessage('User deletion cancelled');
    setNotificationType('info');
    setTimeout(() => setShowNotificationPane(false), 3000);
    
    setShowDeleteUserModal(false);
    setUserToDelete(null);
  };

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Document Type management functions
  const handleAddDocumentType = async (name, description, dateUploaded, timeUploaded, uploadedBy) => {
    try {
      const response = await fetch(`${API_URL}/document-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          description,
          dateUploaded,
          timeUploaded,
          uploadedBy
        }),
      });

      if (response.ok) {
        const newType = await response.json();
        setDocumentTypes(prevTypes => [...prevTypes, newType]);
        setShowNotificationPane(true);
        setNotificationMessage(`Document type "${name}" has been successfully created!`);
        setNotificationType('success');
        setTimeout(() => setShowNotificationPane(false), 3000);
        // Refresh document types list
        fetchDocumentTypes();
        return true;
      } else {
        const error = await response.json();
        setShowNotificationPane(true);
        setNotificationMessage(error.message || 'Failed to create document type. Please try again.');
        setNotificationType('error');
        setTimeout(() => setShowNotificationPane(false), 3000);
        return false;
      }
    } catch (error) {
      console.error('Error creating document type:', error);
      setShowNotificationPane(true);
      setNotificationMessage('Network error. Please check your connection and try again.');
      setNotificationType('error');
      setTimeout(() => setShowNotificationPane(false), 3000);
      return false;
    }
  };

  const handleUpdateDocumentType = async (id, name, description, isActive, dateUploaded, timeUploaded, uploadedBy) => {
    try {
      const response = await fetch(`${API_URL}/document-types/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          description, 
          isActive,
          dateUploaded,
          timeUploaded,
          uploadedBy
        }),
      });

      if (response.ok) {
        const updatedType = await response.json();
        setDocumentTypes(prevTypes =>
          prevTypes.map(type => (type._id === id ? updatedType : type))
        );
        setShowNotificationPane(true);
        setNotificationMessage(`Document type "${name}" has been successfully updated!`);
        setNotificationType('success');
        setTimeout(() => setShowNotificationPane(false), 3000);
        return true;
      } else {
        const error = await response.json();
        setShowNotificationPane(true);
        setNotificationMessage(error.message || 'Failed to update document type. Please try again.');
        setNotificationType('error');
        setTimeout(() => setShowNotificationPane(false), 3000);
        return false;
      }
    } catch (error) {
      console.error('Error updating document type:', error);
      setShowNotificationPane(true);
      setNotificationMessage('Network error. Please check your connection and try again.');
      setNotificationType('error');
      setTimeout(() => setShowNotificationPane(false), 3000);
      return false;
    }
  };

  const handleDeleteDocumentType = (id, name) => {
    setDocumentTypeToDelete({ id, name });
    setShowDeleteDocumentTypeModal(true);
  };

  const confirmDeleteDocumentType = async () => {
    if (!documentTypeToDelete) return;

    try {
      const response = await fetch(`${API_URL}/document-types/${documentTypeToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDocumentTypes(prevTypes => prevTypes.filter(type => type._id !== documentTypeToDelete.id));
        setShowNotificationPane(true);
        setNotificationMessage(`Document type "${documentTypeToDelete.name}" has been successfully deleted`);
        setNotificationType('success');
        setTimeout(() => setShowNotificationPane(false), 3000);
        // Refresh document types list
        fetchDocumentTypes();
      } else {
        const error = await response.json();
        setShowNotificationPane(true);
        setNotificationMessage(error.message || 'Failed to delete document type. Please try again.');
        setNotificationType('error');
        setTimeout(() => setShowNotificationPane(false), 3000);
      }
    } catch (error) {
      console.error('Error deleting document type:', error);
      setShowNotificationPane(true);
      setNotificationMessage('Network error. Please check your connection and try again.');
      setNotificationType('error');
      setTimeout(() => setShowNotificationPane(false), 3000);
    }
    
    setShowDeleteDocumentTypeModal(false);
    setDocumentTypeToDelete(null);
  };

  const cancelDeleteDocumentType = () => {
    setShowNotificationPane(true);
    setNotificationMessage('Document type deletion cancelled');
    setNotificationType('info');
    setTimeout(() => setShowNotificationPane(false), 3000);
    
    setShowDeleteDocumentTypeModal(false);
    setDocumentTypeToDelete(null);
  };

  // Statistics are handled by the Reports component

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const cancelLogout = () => {
    setShowNotificationPane(true);
    setNotificationMessage('Logout cancelled');
    setNotificationType('info');
    setTimeout(() => setShowNotificationPane(false), 3000);
    setShowLogoutModal(false);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Employee':
        return <Employee />;
      case 'Office':
        return <Office />;
      case 'Document':
        return <Document />;
      case 'Users':
        return (
          <div>
            {/* Header Section */}
            <div style={{
              background: '#f8f9fa',
              color: '#2c3e50',
              padding: '15px 20px',
              borderRadius: '8px',
              marginBottom: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              border: '1px solid #e9ecef'
            }}>
              <h1 style={{ 
                margin: '0', 
                fontSize: '20px', 
                fontWeight: '600' 
              }}>
                User Management
              </h1>
            </div>

            {/* Users Table */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              padding: '30px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              border: '1px solid #f1f3f4'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '25px'
              }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '24px', 
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  All Users ({filteredUsers.length})
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={fetchUsers}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#2980b9';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#3498db';
                    }}
                    title="Refresh users list"
                  >
                    Refresh
                  </button>
                  <button
                    disabled={!isCurrentUserAdmin()}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: !isCurrentUserAdmin() ? '#95a5a6' : '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: !isCurrentUserAdmin() ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      opacity: !isCurrentUserAdmin() ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (isCurrentUserAdmin()) {
                        e.target.style.backgroundColor = '#219a52';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isCurrentUserAdmin()) {
                        e.target.style.backgroundColor = '#27ae60';
                      }
                    }}
                    onClick={openAddUserModal}
                  >
                    ADD USER
                  </button>
                </div>
              </div>

              {/* Search and Filter Controls */}
              <div style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '25px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  placeholder="Search users by name, email, employee ID, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: '1',
                    minWidth: '300px',
                    padding: '12px 15px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{
                    padding: '12px 15px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    minWidth: '150px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
                >
                  <option value="All">All Roles</option>
                  {roleOptions.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                  <option value="">No Role</option>
                </select>
                {(searchTerm || roleFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setRoleFilter('All');
                    }}
                    style={{
                      padding: '12px 15px',
                      backgroundColor: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#7f8c8d';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#95a5a6';
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
              
              {loading ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  fontSize: '18px',
                  color: '#7f8c8d'
                }}>
                  Loading users...
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ 
                          border: '1px solid #ddd', 
                          padding: '15px 10px', 
                          textAlign: 'left', 
                          backgroundColor: '#f8f9fa',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#2c3e50'
                        }}>
                          Username
                        </th>
                        <th style={{ 
                          border: '1px solid #ddd', 
                          padding: '15px 10px', 
                          textAlign: 'left', 
                          backgroundColor: '#f8f9fa',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#2c3e50'
                        }}>
                          Email
                        </th>
                        <th style={{ 
                          border: '1px solid #ddd', 
                          padding: '15px 10px', 
                          textAlign: 'left', 
                          backgroundColor: '#f8f9fa',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#2c3e50'
                        }}>
                          Employee ID
                        </th>
                        <th style={{ 
                          border: '1px solid #ddd', 
                          padding: '15px 10px', 
                          textAlign: 'left', 
                          backgroundColor: '#f8f9fa',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#2c3e50'
                        }}>
                          Join Date
                        </th>
                        <th style={{ 
                          border: '1px solid #ddd', 
                          padding: '15px 10px', 
                          textAlign: 'left', 
                          backgroundColor: '#f8f9fa',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#2c3e50'
                        }}>
                          Role
                        </th>
                        <th style={{ 
                          border: '1px solid #ddd', 
                          padding: '15px 10px', 
                          textAlign: 'center', 
                          backgroundColor: '#f8f9fa',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#2c3e50'
                        }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user._id}>
                            <td style={{ 
                              border: '1px solid #ddd', 
                              padding: '15px 10px',
                              fontSize: '16px',
                              color: '#2c3e50'
                            }}>
                              {user.username}
                            </td>
                            <td style={{ 
                              border: '1px solid #ddd', 
                              padding: '15px 10px',
                              fontSize: '16px',
                              color: '#2c3e50'
                            }}>
                              {user.email}
                            </td>
                            <td style={{ 
                              border: '1px solid #ddd', 
                              padding: '15px 10px',
                              fontSize: '16px',
                              color: '#2c3e50'
                            }}>
                              {user.employeeId || 'Not Linked'}
                            </td>
                            <td style={{ 
                              border: '1px solid #ddd', 
                              padding: '15px 10px',
                              fontSize: '14px',
                              color: '#7f8c8d'
                            }}>
                              {user.date ? new Date(user.date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td style={{ 
                              border: '1px solid #ddd', 
                              padding: '15px 10px'
                            }}>
                              {user.role || 'No Role'}
                              {user.email === 'sadmin@gmail.com' && (
                                <div style={{
                                  fontSize: '10px',
                                  color: '#e74c3c',
                                  marginTop: '4px',
                                  fontWeight: '600'
                                }}>
                                  Protected Account
                                </div>
                              )}
                            </td>
                            <td style={{ 
                              border: '1px solid #ddd', 
                              padding: '8px'
                            }}>
                              <button
                                onClick={() => openEditUserModal(user)}
                                disabled={user.email === 'sadmin@gmail.com'}
                                style={{
                                  padding: '5px 10px',
                                  backgroundColor: user.email === 'sadmin@gmail.com' ? '#95a5a6' : '#ffc107',
                                  color: 'black',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: user.email === 'sadmin@gmail.com' ? 'not-allowed' : 'pointer',
                                  marginRight: '5px',
                                  opacity: user.email === 'sadmin@gmail.com' ? 0.5 : 1
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleRemoveUser(user._id, user.username, user.email)}
                                disabled={user.email === 'sadmin@gmail.com'}
                                style={{
                                  padding: '5px 10px',
                                  backgroundColor: user.email === 'sadmin@gmail.com' ? '#95a5a6' : '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: user.email === 'sadmin@gmail.com' ? 'not-allowed' : 'pointer',
                                  opacity: user.email === 'sadmin@gmail.com' ? 0.5 : 1
                                }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td 
                            colSpan="6" 
                            style={{ 
                              border: '1px solid #ddd', 
                              padding: '40px',
                              textAlign: 'center',
                              color: '#95a5a6',
                              fontSize: '16px'
                            }}
                          >
                            {searchTerm || roleFilter !== 'All' ? 
                              `No users found matching your search criteria` : 
                              `No users found`
                            }
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      case 'DocumentList':
        return (
          <div>
            {/* Documents Section */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '25px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  margin: '0',
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  textAlign: 'left'
                }}>
                  Document Lists
                </h2>
                <button
                  onClick={() => fetchDocuments()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#2980b9';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#3498db';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  🔄 Refresh
                </button>
              </div>

              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
                  Loading documents...
                </div>
              ) : documents.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    fontSize: '13px'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#3498db', color: 'white' }}>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #2980b9' }}>Document ID</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #2980b9' }}>Name</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #2980b9' }}>Type</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #2980b9' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc._id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                          <td style={{ padding: '12px', color: '#7f8c8d', textAlign: 'center' }}>{doc.documentId}</td>
                          <td style={{ padding: '12px', fontWeight: '500', color: '#2c3e50', textAlign: 'center' }}>{doc.name}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: '#ecf0f1',
                              color: '#2c3e50'
                            }}>
                              {doc.type}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: doc.status === 'Approved' ? '#28a745' : 
                                             doc.status === 'Rejected' ? '#dc3545' :
                                             doc.status === 'Under Review' ? '#ffc107' :
                                             doc.status === 'On Hold' ? '#f39c12' : '#17a2b8',
                              color: 'white'
                            }}>
                              {doc.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  color: '#95a5a6',
                  fontSize: '16px'
                }}>
                  No documents found in the database
                </div>
              )}
            </div>
          </div>
        );
      case 'DocumentType':
        // Display document types from database (created via "Add New Type of Document")
        const displayTypes = documentTypes.map(type => ({
          _id: type._id,
          type: type.name,
          description: type.description,
          dateUploaded: type.dateUploaded || '',
          timeUploaded: type.timeUploaded || '',
          uploadedBy: type.uploadedBy || 'N/A'
        })).sort((a, b) => {
          // Sort by date uploaded (most recent first)
          if (a.dateUploaded && b.dateUploaded) {
            return new Date(b.dateUploaded) - new Date(a.dateUploaded);
          }
          return 0;
        });

        return (
          <div>
            {/* Header Section */}
            <div style={{
              background: '#f8f9fa',
              color: '#2c3e50',
              padding: '15px 20px',
              borderRadius: '8px',
              marginBottom: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              border: '1px solid #e9ecef'
            }}>
              <h1 style={{ 
                margin: '0', 
                fontSize: '20px', 
                fontWeight: '600' 
              }}>
                Document Type
              </h1>
            </div>

            {/* Document Types Section */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              padding: '25px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '15px'
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Document Types ({displayTypes.length})
                </h2>
                <button
                  onClick={() => {
                    // Get current logged-in user and set default date/time
                    const userData = localStorage.getItem('userData');
                    const loggedInUser = userData ? JSON.parse(userData) : null;
                    const now = new Date();
                    const dateStr = now.toISOString().split('T')[0];
                    const timeStr = now.toTimeString().slice(0, 5);
                    
                    // Get logged-in user name (username or email)
                    const loggedInUserName = loggedInUser?.username || loggedInUser?.email || 'Unknown User';
                    
                    setNewDocumentType({ 
                      name: '', 
                      description: '',
                      dateUploaded: dateStr,
                      timeUploaded: timeStr,
                      uploadedBy: loggedInUserName,
                      file: null
                    });
                    setShowAddDocumentTypeModal(true);
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#229954'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#27ae60'}
                >
                  Add New Type of Document
                </button>
              </div>

              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
                  Loading document types...
                </div>
              ) : displayTypes.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ 
                          border: '1px solid #ddd', 
                          padding: '15px', 
                          textAlign: 'left',
                          fontWeight: '600',
                          color: '#2c3e50',
                          fontSize: '14px'
                        }}>Document Type</th>
                        <th style={{ 
                          border: '1px solid #ddd', 
                          padding: '15px', 
                          textAlign: 'left',
                          fontWeight: '600',
                          color: '#2c3e50',
                          fontSize: '14px'
                        }}>Submitted By</th>
                        <th style={{ 
                          border: '1px solid #ddd', 
                          padding: '15px', 
                          textAlign: 'left',
                          fontWeight: '600',
                          color: '#2c3e50',
                          fontSize: '14px'
                        }}>When its Submitted</th>
                        <th style={{ 
                          border: '1px solid #ddd', 
                          padding: '15px', 
                          textAlign: 'center',
                          fontWeight: '600',
                          color: '#2c3e50',
                          fontSize: '14px'
                        }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayTypes.map((typeData) => {
                        const fullTypeData = documentTypes.find(t => t._id === typeData._id);
                        return (
                          <tr key={typeData._id}>
                            <td style={{ 
                              border: '1px solid #ddd', 
                              padding: '15px 10px',
                              fontWeight: '500'
                            }}>
                              <span style={{
                                padding: '6px 14px',
                                borderRadius: '12px',
                                fontSize: '13px',
                                fontWeight: '600',
                                backgroundColor: '#e3f2fd',
                                color: '#1976d2'
                              }}>
                                {typeData.type}
                              </span>
                            </td>
                            <td style={{ 
                              border: '1px solid #ddd', 
                              padding: '15px 10px',
                              color: '#2c3e50'
                            }}>
                              {typeData.uploadedBy}
                            </td>
                            <td style={{ 
                              border: '1px solid #ddd', 
                              padding: '15px 10px',
                              color: '#7f8c8d'
                            }}>
                              {typeData.dateUploaded ? new Date(typeData.dateUploaded).toLocaleDateString() : 'N/A'}
                            </td>
                            <td style={{ 
                              border: '1px solid #ddd', 
                              padding: '15px 10px',
                              textAlign: 'center'
                            }}>
                              <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => {
                                    setEditingDocumentType(fullTypeData);
                                    setShowAddDocumentTypeModal(true);
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#f39c12',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.3s ease'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e67e22'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f39c12'}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (fullTypeData) {
                                      setViewingDocumentType(fullTypeData);
                                    }
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#3498db',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.3s ease'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleDeleteDocumentType(typeData._id, typeData.type)}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.3s ease'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = '#c0392b'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = '#e74c3c'}
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  color: '#95a5a6',
                  fontSize: '16px'
                }}>
                  No document types found. Upload documents to see types.
                </div>
              )}
            </div>

            {/* Add/Edit Document Type Modal */}
            {showAddDocumentTypeModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '15px',
                  padding: '30px',
                  width: '90%',
                  maxWidth: '500px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                }}>
                  <h2 style={{ margin: '0 0 20px 0', fontSize: '22px', fontWeight: '600' }}>
                    {editingDocumentType ? 'Edit Document Type' : 'Add New Type of Document'}
                  </h2>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                      Type Name *
                    </label>
                    <input
                      type="text"
                      value={editingDocumentType ? editingDocumentType.name : newDocumentType.name}
                      onChange={(e) => {
                        if (editingDocumentType) {
                          setEditingDocumentType({ ...editingDocumentType, name: e.target.value });
                        } else {
                          setNewDocumentType({ ...newDocumentType, name: e.target.value });
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                      placeholder="Enter document type name"
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                      Upload File
                    </label>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (editingDocumentType) {
                          setEditingDocumentType({ ...editingDocumentType, file: file });
                        } else {
                          setNewDocumentType({ ...newDocumentType, file: file });
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                    {newDocumentType.file && (
                      <p style={{ 
                        marginTop: '5px', 
                        fontSize: '12px', 
                        color: '#27ae60',
                        fontWeight: '500'
                      }}>
                        Selected: {newDocumentType.file.name}
                      </p>
                    )}
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                      Description
                    </label>
                    <textarea
                      value={editingDocumentType ? editingDocumentType.description : newDocumentType.description}
                      onChange={(e) => {
                        if (editingDocumentType) {
                          setEditingDocumentType({ ...editingDocumentType, description: e.target.value });
                        } else {
                          setNewDocumentType({ ...newDocumentType, description: e.target.value });
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        minHeight: '80px',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                      placeholder="Enter description (optional)"
                    />
                  </div>
                  {!editingDocumentType && (
                    <>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                          Date Uploaded *
                        </label>
                        <input
                          type="date"
                          value={newDocumentType.dateUploaded}
                          onChange={(e) => {
                            setNewDocumentType({ ...newDocumentType, dateUploaded: e.target.value });
                          }}
                          required
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                          Time Uploaded *
                        </label>
                        <input
                          type="time"
                          value={newDocumentType.timeUploaded}
                          onChange={(e) => {
                            setNewDocumentType({ ...newDocumentType, timeUploaded: e.target.value });
                          }}
                          required
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                          User Who Uploaded *
                        </label>
                        <input
                          type="text"
                          value={newDocumentType.uploadedBy}
                          readOnly
                          disabled
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            boxSizing: 'border-box',
                            backgroundColor: '#f5f5f5',
                            color: '#666',
                            cursor: 'not-allowed'
                          }}
                          placeholder="Logged-in user"
                        />
                      </div>
                    </>
                  )}
                  {editingDocumentType && (
                    <>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                          Date Uploaded *
                        </label>
                        <input
                          type="date"
                          value={editingDocumentType.dateUploaded || ''}
                          onChange={(e) => {
                            setEditingDocumentType({ ...editingDocumentType, dateUploaded: e.target.value });
                          }}
                          required
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                          Time Uploaded *
                        </label>
                        <input
                          type="time"
                          value={editingDocumentType.timeUploaded || ''}
                          onChange={(e) => {
                            setEditingDocumentType({ ...editingDocumentType, timeUploaded: e.target.value });
                          }}
                          required
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                          User Who Uploaded *
                        </label>
                        <input
                          type="text"
                          value={editingDocumentType.uploadedBy || ''}
                          onChange={(e) => {
                            setEditingDocumentType({ ...editingDocumentType, uploadedBy: e.target.value });
                          }}
                          required
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                          placeholder="Enter user name or email"
                        />
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={editingDocumentType.isActive}
                            onChange={(e) => {
                              setEditingDocumentType({ ...editingDocumentType, isActive: e.target.checked });
                            }}
                          />
                          <span style={{ fontWeight: '600' }}>Active</span>
                        </label>
                      </div>
                    </>
                  )}
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setShowAddDocumentTypeModal(false);
                        setEditingDocumentType(null);
                        setNewDocumentType({ 
                          name: '', 
                          description: '',
                          dateUploaded: '',
                          timeUploaded: '',
                          uploadedBy: '',
                          file: null
                        });
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#95a5a6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (editingDocumentType) {
                          if (!editingDocumentType.dateUploaded || !editingDocumentType.timeUploaded || !editingDocumentType.uploadedBy) {
                            showModal('Error', 'Please fill in all required fields (Date Uploaded, Time Uploaded, User Who Uploaded).', 'error');
                            return;
                          }
                          const success = await handleUpdateDocumentType(
                            editingDocumentType._id,
                            editingDocumentType.name,
                            editingDocumentType.description,
                            editingDocumentType.isActive,
                            editingDocumentType.dateUploaded,
                            editingDocumentType.timeUploaded,
                            editingDocumentType.uploadedBy
                          );
                          if (success) {
                            setShowAddDocumentTypeModal(false);
                            setEditingDocumentType(null);
                          }
                        } else {
                          if (!newDocumentType.name.trim()) {
                            setShowNotificationPane(true);
                            setNotificationMessage('Please enter a document type name');
                            setNotificationType('error');
                            setTimeout(() => setShowNotificationPane(false), 3000);
                            return;
                          }
                          if (!newDocumentType.dateUploaded || !newDocumentType.timeUploaded || !newDocumentType.uploadedBy) {
                            setShowNotificationPane(true);
                            setNotificationMessage('Please fill in all required fields (Date Uploaded, Time Uploaded, User Who Uploaded)');
                            setNotificationType('error');
                            setTimeout(() => setShowNotificationPane(false), 3000);
                            return;
                          }
                          const success = await handleAddDocumentType(
                            newDocumentType.name,
                            newDocumentType.description,
                            newDocumentType.dateUploaded,
                            newDocumentType.timeUploaded,
                            newDocumentType.uploadedBy
                          );
                          if (success) {
                            setShowAddDocumentTypeModal(false);
                            setNewDocumentType({ 
                              name: '', 
                              description: '',
                              dateUploaded: '',
                              timeUploaded: '',
                              uploadedBy: '',
                              file: null
                            });
                            // Refresh document types list to show the new type
                            fetchDocumentTypes();
                          }
                        }
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {editingDocumentType ? 'Update' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return <Reports />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ 
        width: '250px', 
        backgroundColor: '#2c3e50', 
        color: 'white',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        overflowY: 'auto',
        zIndex: 1000
      }}>
        {/* Header */}
        <div style={{ 
          padding: '30px 20px', 
          borderBottom: '1px solid #34495e',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: '600',
            color: '#ecf0f1'
          }}>
           Autodoxis
          </h2>
          <p style={{ 
            margin: '5px 0 0 0', 
            fontSize: '12px', 
            color: '#95a5a6',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Routing System
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '20px 0' }}>
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '5px' }}>
              <div 
                style={{ 
                  padding: '12px 20px', 
                  cursor: 'pointer',
                  backgroundColor: currentScreen === 'Dashboard' ? '#34495e' : 'transparent',
                  borderLeft: currentScreen === 'Dashboard' ? '4px solid #3498db' : '4px solid transparent',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onClick={() => setCurrentScreen('Dashboard')}
                onMouseEnter={(e) => {
                  if (currentScreen !== 'Dashboard') {
                    e.target.style.backgroundColor = '#34495e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentScreen !== 'Dashboard') {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Dashboard
              </div>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <div 
                style={{ 
                  padding: '12px 20px', 
                  cursor: 'pointer',
                  backgroundColor: currentScreen === 'Employee' ? '#34495e' : 'transparent',
                  borderLeft: currentScreen === 'Employee' ? '4px solid #3498db' : '4px solid transparent',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onClick={() => setCurrentScreen('Employee')}
                onMouseEnter={(e) => {
                  if (currentScreen !== 'Employee') {
                    e.target.style.backgroundColor = '#34495e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentScreen !== 'Employee') {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
               Employees
              </div>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <div 
                style={{ 
                  padding: '12px 20px', 
                  cursor: 'pointer',
                  backgroundColor: currentScreen === 'Office' ? '#34495e' : 'transparent',
                  borderLeft: currentScreen === 'Office' ? '4px solid #3498db' : '4px solid transparent',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onClick={() => setCurrentScreen('Office')}
                onMouseEnter={(e) => {
                  if (currentScreen !== 'Office') {
                    e.target.style.backgroundColor = '#34495e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentScreen !== 'Office') {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Offices
              </div>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <div 
                style={{ 
                  padding: '12px 20px', 
                  cursor: 'pointer',
                  backgroundColor: currentScreen === 'Document' ? '#34495e' : 'transparent',
                  borderLeft: currentScreen === 'Document' ? '4px solid #3498db' : '4px solid transparent',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onClick={() => setCurrentScreen('Document')}
                onMouseEnter={(e) => {
                  if (currentScreen !== 'Document') {
                    e.target.style.backgroundColor = '#34495e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentScreen !== 'Document') {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Documents
              </div>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <div 
                style={{ 
                  padding: '12px 20px', 
                  cursor: 'pointer',
                  backgroundColor: currentScreen === 'Users' ? '#34495e' : 'transparent',
                  borderLeft: currentScreen === 'Users' ? '4px solid #3498db' : '4px solid transparent',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onClick={() => setCurrentScreen('Users')}
                onMouseEnter={(e) => {
                  if (currentScreen !== 'Users') {
                    e.target.style.backgroundColor = '#34495e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentScreen !== 'Users') {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Users
              </div>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <div 
                style={{ 
                  padding: '12px 20px', 
                  cursor: 'pointer',
                  backgroundColor: currentScreen === 'DocumentList' ? '#34495e' : 'transparent',
                  borderLeft: currentScreen === 'DocumentList' ? '4px solid #3498db' : '4px solid transparent',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onClick={() => setCurrentScreen('DocumentList')}
                onMouseEnter={(e) => {
                  if (currentScreen !== 'DocumentList') {
                    e.target.style.backgroundColor = '#34495e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentScreen !== 'DocumentList') {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Document List
              </div>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <div 
                style={{ 
                  padding: '12px 20px', 
                  cursor: 'pointer',
                  backgroundColor: currentScreen === 'DocumentType' ? '#34495e' : 'transparent',
                  borderLeft: currentScreen === 'DocumentType' ? '4px solid #3498db' : '4px solid transparent',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onClick={() => setCurrentScreen('DocumentType')}
                onMouseEnter={(e) => {
                  if (currentScreen !== 'DocumentType') {
                    e.target.style.backgroundColor = '#34495e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentScreen !== 'DocumentType') {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Document Type
              </div>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div style={{ 
          padding: '20px', 
          borderTop: '1px solid #34495e'
        }}>
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%',
              padding: '12px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#c0392b';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#e74c3c';
            }}
          >
            Logout
          </button>
        </div>
      </div>
      <div style={{ 
        flexGrow: 1, 
        padding: '30px', 
        backgroundColor: '#fff',
        marginLeft: '250px',
        minHeight: '100vh'
      }}>
        {renderScreen()}
      </div>
      
      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      {/* Add User Modal */}
      {addUserModal.isOpen && (
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
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
              borderBottom: '2px solid #f1f3f4',
              paddingBottom: '15px'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                Add New User
              </h2>
              <button
                onClick={closeAddUserModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#95a5a6',
                  padding: '5px',
                  borderRadius: '50%',
                  width: '35px',
                  height: '35px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Email Field */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Enter email address"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
                />
              </div>

              {/* Password Field */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Password *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Enter password (min 6 characters)"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
                />
              </div>

              {/* Employee ID Field */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Employee ID (Optional)
                </label>
                <input
                  type="text"
                  value={newUser.employeeId}
                  onChange={(e) => {
                    const employeeId = e.target.value;
                    setNewUser({
                      ...newUser, 
                      employeeId: employeeId,
                      // Automatically set role to 'User' if employeeId is provided
                      role: employeeId ? 'User' : ''
                    });
                  }}
                  placeholder="Enter employee ID"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
                />
                {newUser.employeeId && (
                  <p style={{
                    marginTop: '5px',
                    fontSize: '12px',
                    color: '#27ae60',
                    fontStyle: 'italic'
                  }}>
                    Role will be automatically set to "User" for employees
                  </p>
                )}
              </div>

              {/* Role Field */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Role {newUser.employeeId && <span style={{ color: '#7f8c8d', fontSize: '12px', fontWeight: 'normal' }}>(Auto-set to "User" for employees)</span>}
                </label>
                <select
                  value={newUser.employeeId ? 'User' : (newUser.role || '')}
                  onChange={(e) => {
                    if (!newUser.employeeId) {
                      setNewUser({...newUser, role: e.target.value});
                    }
                  }}
                  disabled={!!newUser.employeeId}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: newUser.employeeId ? '#f8f9fa' : 'white',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box',
                    cursor: newUser.employeeId ? 'not-allowed' : 'pointer',
                    color: newUser.employeeId ? '#7f8c8d' : '#2c3e50'
                  }}
                  onFocus={(e) => {
                    if (!newUser.employeeId) {
                      e.target.style.borderColor = '#3498db';
                    }
                  }}
                  onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
                >
                  <option value="">Select a role</option>
                  {roleOptions.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'flex-end',
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '2px solid #f1f3f4'
            }}>
              <button
                onClick={closeAddUserModal}
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
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#7f8c8d';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#95a5a6';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#219a52';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#27ae60';
                }}
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserModal.isOpen && editingUser && (
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
            maxWidth: '90%'
          }}>
            <h3 style={{ marginTop: 0 }}>Edit User Role</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Username:</label>
              <input
                type="text"
                value={editingUser.username}
                disabled
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                  color: '#6c757d'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email:</label>
              <input
                type="text"
                value={editingUser.email}
                disabled
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                  color: '#6c757d'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Role:</label>
              <select
                value={editingUser.role || ''}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">No Role</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeEditUserModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUserRole}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Document Type Modal */}
      {viewingDocumentType && (
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
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '600px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e9ecef'
            }}>
              <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '24px' }}>Document Type Details</h2>
              <button
                onClick={() => setViewingDocumentType(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#6c757d',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Type Name */}
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6c757d',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px'
                }}>
                  Type Name
                </label>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  {viewingDocumentType.name}
                </div>
              </div>

              {/* Description */}
              {viewingDocumentType.description && (
                <div>
                  <label style={{ 
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6c757d',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px'
                  }}>
                    Description
                  </label>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#2c3e50',
                    lineHeight: '1.6'
                  }}>
                    {viewingDocumentType.description}
                  </div>
                </div>
              )}

              {/* Date and Time Uploaded */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ 
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6c757d',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px'
                  }}>
                    Date Uploaded
                  </label>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#2c3e50',
                    fontWeight: '500'
                  }}>
                    {viewingDocumentType.dateUploaded || 'N/A'}
                  </div>
                </div>
                <div>
                  <label style={{ 
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6c757d',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px'
                  }}>
                    Time Uploaded
                  </label>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#2c3e50',
                    fontWeight: '500'
                  }}>
                    {viewingDocumentType.timeUploaded || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Uploaded By and Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ 
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6c757d',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px'
                  }}>
                    Uploaded By
                  </label>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#2c3e50',
                    fontWeight: '500'
                  }}>
                    {viewingDocumentType.uploadedBy || 'N/A'}
                  </div>
                </div>
                <div>
                  <label style={{ 
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6c757d',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px'
                  }}>
                    Status
                  </label>
                  <span style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: viewingDocumentType.isActive ? '#d4edda' : '#f8d7da',
                    color: viewingDocumentType.isActive ? '#155724' : '#721c24'
                  }}>
                    {viewingDocumentType.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Date Created */}
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6c757d',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px'
                }}>
                  Date Created
                </label>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#2c3e50',
                  fontWeight: '500'
                }}>
                  {new Date(viewingDocumentType.dateCreated).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div style={{ 
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setViewingDocumentType(null)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
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
          zIndex: 2000
        }}
        onClick={cancelLogout}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'scaleIn 0.2s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '12px'
            }}>
              Confirm Logout
            </div>
            <div style={{
              fontSize: '15px',
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Are you sure you want to logout?
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cancelLogout}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#c0392b';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#e74c3c';
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Document Type Confirmation Modal */}
      {showDeleteDocumentTypeModal && documentTypeToDelete && (
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
          zIndex: 2000
        }}
        onClick={cancelDeleteDocumentType}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'scaleIn 0.2s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '12px'
            }}>
              Confirm Deletion
            </div>
            <div style={{
              fontSize: '15px',
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete the document type <strong>"{documentTypeToDelete.name}"</strong>? This action cannot be undone.
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cancelDeleteDocumentType}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDocumentType}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#ef4444';
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteUserModal && userToDelete && (
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
          zIndex: 2000
        }}
        onClick={cancelDeleteUser}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'scaleIn 0.2s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '12px'
            }}>
              Confirm Deletion
            </div>
            <div style={{
              fontSize: '15px',
              color: '#6b7280',
              marginBottom: '8px',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete user <strong>"{userToDelete.username}"</strong>?
            </div>
            <div style={{
              fontSize: '14px',
              color: '#9ca3af',
              marginBottom: '24px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px'
            }}>
              Email: {userToDelete.email}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#ef4444',
              marginBottom: '24px',
              fontWeight: '500'
            }}>
              This action cannot be undone.
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cancelDeleteUser}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#ef4444';
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {showNotificationPane && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px 24px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e5e7eb',
          zIndex: 2001,
          minWidth: '320px',
          maxWidth: '400px',
          animation: 'slideInRight 0.3s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}
        onClick={() => setShowNotificationPane(false)}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: notificationType === 'success' ? '#f0fdf4' : notificationType === 'error' ? '#fef2f2' : '#eff6ff',
            color: notificationType === 'success' ? '#22c55e' : notificationType === 'error' ? '#ef4444' : '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            {notificationType === 'success' ? '✓' : notificationType === 'error' ? '✗' : 'ℹ'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '4px'
            }}>
              {notificationMessage}
            </div>
          </div>
          <button
            onClick={() => setShowNotificationPane(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '4px',
              lineHeight: '1',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#6b7280';
              e.target.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#9ca3af';
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ×
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default Aboard;
