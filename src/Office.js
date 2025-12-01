import React, { useState, useEffect } from 'react';
import API_URL from './config';

function Office() {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [officeToDelete, setOfficeToDelete] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success'); // 'success', 'error', or 'info'
  const [editingOffice, setEditingOffice] = useState(null);
  const [offices, setOffices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    officeId: '',
    name: '',
    department: ''
  });

  // Fetch offices from backend on component mount
  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    try {
      const response = await fetch(`${API_URL}/offices`);
      const data = await response.json();
      setOffices(data);
    } catch (error) {
      console.error('Error fetching offices:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingOffice) {
        // Update existing office
        const response = await fetch(`${API_URL}/offices/${editingOffice._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (response.ok) {
          setShowNotification(true);
          setNotificationMessage('Office updated successfully');
          setNotificationType('success');
          fetchOffices(); // Refresh the list
          setTimeout(() => setShowNotification(false), 3000);
        } else {
          setShowNotification(true);
          setNotificationMessage('Failed to update office');
          setNotificationType('error');
          setTimeout(() => setShowNotification(false), 3000);
        }
      } else {
        // Add new office
        const response = await fetch(`${API_URL}/offices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (response.ok) {
          setShowNotification(true);
          setNotificationMessage('Office added successfully');
          setNotificationType('success');
          fetchOffices(); // Refresh the list
          setTimeout(() => setShowNotification(false), 3000);
        } else {
          setShowNotification(true);
          setNotificationMessage('Failed to add office');
          setNotificationType('error');
          setTimeout(() => setShowNotification(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error saving office:', error);
      setShowNotification(true);
      setNotificationMessage('Error saving office');
      setNotificationType('error');
      setTimeout(() => setShowNotification(false), 3000);
    }
    
    // Reset form and close modal
    setFormData({
      officeId: '',
      name: '',
      department: ''
    });
    setEditingOffice(null);
    setShowModal(false);
  };

  const handleEdit = (office) => {
    setEditingOffice(office);
    setFormData({
      officeId: office.officeId,
      name: office.name,
      department: office.department
    });
    setShowModal(true);
  };

  const handleRemove = (officeId) => {
    const office = offices.find(off => off._id === officeId);
    setOfficeToDelete({ id: officeId, name: office?.name || 'this office' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!officeToDelete) return;
    
    try {
      const response = await fetch(`${API_URL}/offices/${officeToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setShowNotification(true);
        setNotificationMessage('Office removed successfully');
        setNotificationType('success');
        fetchOffices(); // Refresh the list
        setTimeout(() => setShowNotification(false), 3000);
      } else {
        setShowNotification(true);
        setNotificationMessage('Failed to remove office');
        setNotificationType('error');
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      console.error('Error removing office:', error);
      setShowNotification(true);
      setNotificationMessage('Error removing office');
      setNotificationType('error');
      setTimeout(() => setShowNotification(false), 3000);
    }
    
    setShowDeleteModal(false);
    setOfficeToDelete(null);
  };

  const cancelDelete = () => {
    setShowNotification(true);
    setNotificationMessage('Office deletion cancelled');
    setNotificationType('info');
    setTimeout(() => setShowNotification(false), 3000);
    
    setShowDeleteModal(false);
    setOfficeToDelete(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOffice(null);
    setFormData({
      officeId: '',
      name: '',
      department: ''
    });
  };

  // Filter and sort offices automatically
  const getFilteredAndSortedOffices = () => {
    let filtered = offices.filter(office =>
      office.officeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Automatically sort by office name (alphabetically)
    filtered.sort((a, b) => {
      const aValue = a.name?.toString().toLowerCase() || '';
      const bValue = b.name?.toString().toLowerCase() || '';
      return aValue.localeCompare(bValue);
    });

    return filtered;
  };

  const filteredAndSortedOffices = getFilteredAndSortedOffices();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Office Management</h2>
        <button 
          onClick={() => setShowModal(true)}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Add New Office
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search offices by ID, name, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px'
          }}
        />
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f8f9fa' }}>
              Office ID
            </th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f8f9fa' }}>
              Office Name
            </th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f8f9fa' }}>
              Department
            </th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
              Number of Employees
            </th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f8f9fa' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedOffices.map((office) => (
            <tr key={office._id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{office.officeId}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{office.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{office.department}</td>
              <td style={{ 
                border: '1px solid #ddd', 
                padding: '8px', 
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '16px',
                color: office.employees && office.employees.length > 0 ? '#007bff' : '#999'
              }}>
                {office.employees ? office.employees.length : 0}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                <button
                  onClick={() => handleEdit(office)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#ffc107',
                    color: 'black',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    marginRight: '5px'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRemove(office._id)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && officeToDelete && (
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
        onClick={cancelDelete}
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
              Are you sure you want to remove <strong>{officeToDelete.name}</strong>? This action cannot be undone.
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cancelDelete}
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
                onClick={confirmDelete}
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
      {showNotification && (
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
        onClick={() => setShowNotification(false)}
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
            onClick={() => setShowNotification(false)}
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

      {/* Add/Edit Office Modal */}
      {showModal && (
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
            <h3>{editingOffice ? 'Edit Office' : 'Add New Office'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Office ID:</label>
                <input
                  type="text"
                  name="officeId"
                  value={formData.officeId}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Office Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Department:</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter department name"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
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
                  type="submit"
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer' 
                  }}
                >
                  {editingOffice ? 'Update Office' : 'Add Office'}
                </button>
              </div>
            </form>
          </div>
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

export default Office;
