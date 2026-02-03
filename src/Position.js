import React, { useState, useEffect } from 'react';
import API_URL from './config';

function Position() {
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success'); // 'success' or 'error'
  const [editingPosition, setEditingPosition] = useState(null);
  const [positions, setPositions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: ''
  });

  // Fetch positions from backend on component mount
  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await fetch(`${API_URL}/positions`);
      const data = await response.json();
      // Ensure data is always an array
      setPositions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching positions:', error);
      setPositions([]); // Set empty array on error
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
      if (editingPosition) {
        // Update existing position
        const positionId = editingPosition._id || editingPosition.id;
        const response = await fetch(`${API_URL}/positions/${positionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (response.ok) {
          alert('Position updated successfully!');
          fetchPositions(); // Refresh the list
        } else {
          const errorData = await response.json();
          const errorMessage = errorData.message || 'Failed to update position';
          alert(`Failed to update position: ${errorMessage}`);
        }
      } else {
        // Add new position
        const response = await fetch(`${API_URL}/positions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (response.ok) {
          // Reset form and close modal
          setFormData({
            name: ''
          });
          setEditingPosition(null);
          setShowModal(false);
          
          // Show success notification
          setShowSuccessModal(true);
          
          // Auto-close after 3 seconds
          setTimeout(() => {
            setShowSuccessModal(false);
          }, 3000);
          
          fetchPositions(); // Refresh the list
        } else {
          const errorData = await response.json();
          const errorMessage = errorData.message || 'Failed to add position';
          alert(`Failed to add position: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Error saving position:', error);
      alert(`Error saving position: ${error.message || 'Network error. Please check your connection and try again.'}`);
    }
    
    // Reset form and close modal (for edit case)
    if (editingPosition) {
      setFormData({
        name: ''
      });
      setEditingPosition(null);
      setShowModal(false);
    }
  };

  const handleEdit = (position) => {
    setEditingPosition(position);
    setFormData({
      name: position.name
    });
    setShowModal(true);
  };

  const handleRemove = (positionId) => {
    const position = positions.find(pos => (pos._id === positionId || pos.id === positionId));
    const idToUse = position?._id || position?.id || positionId;
    setPositionToDelete({ id: idToUse, name: position?.name || 'this position' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!positionToDelete) return;
    
    try {
      const response = await fetch(`${API_URL}/positions/${positionToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setShowNotification(true);
        setNotificationMessage('Position removed successfully');
        setNotificationType('success');
        fetchPositions(); // Refresh the list
        
        // Auto-close notification after 3 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
      } else {
        setShowNotification(true);
        setNotificationMessage('Failed to remove position');
        setNotificationType('error');
        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error removing position:', error);
      setShowNotification(true);
      setNotificationMessage('Error removing position');
      setNotificationType('error');
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    }
    
    setShowDeleteModal(false);
    setPositionToDelete(null);
  };

  const cancelDelete = () => {
    setShowNotification(true);
    setNotificationMessage('Position deletion cancelled');
    setNotificationType('info');
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
    
    setShowDeleteModal(false);
    setPositionToDelete(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPosition(null);
    setFormData({
      name: ''
    });
  };

  // Filter positions automatically
  const getFilteredPositions = () => {
    // Ensure positions is an array before filtering
    if (!Array.isArray(positions)) {
      return [];
    }
    
    // Filter based on search term
    let filtered = positions.filter(position => {
      const searchLower = searchTerm.toLowerCase();
      
      if (!searchTerm) return true; // Show all if no search term
      
      return position.name.toLowerCase().includes(searchLower);
    });

    // Sort by name
    filtered.sort((a, b) => {
      const aValue = a.name?.toString().toLowerCase() || '';
      const bValue = b.name?.toString().toLowerCase() || '';
      return aValue.localeCompare(bValue);
    });

    return filtered;
  };

  const filteredPositions = getFilteredPositions();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Position Management</h2>
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
          Add New Position
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search positions..."
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
      
      {/* Position Table */}
      <div style={{ marginTop: '20px', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Name
                </th>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPositions.length > 0 ? (
                filteredPositions.map((position) => (
                  <tr key={position._id || position.id} style={{ backgroundColor: 'white' }}>
                    <td style={{ border: '1px solid #e0e0e0', padding: '12px', fontSize: '13px', fontWeight: '500', color: '#2c3e50' }}>
                      {position.name}
                    </td>
                    <td style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleEdit(position)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#ffc107',
                            color: 'black',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '500',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#ffb300'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#ffc107'}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemove(position._id || position.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '500',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" style={{ border: '1px solid #e0e0e0', padding: '20px', textAlign: 'center', color: '#999' }}>
                    No positions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success Notification Pane */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px 24px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e5e7eb',
          zIndex: 2000,
          minWidth: '320px',
          maxWidth: '400px',
          animation: 'slideInRight 0.3s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}
        onClick={() => setShowSuccessModal(false)}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#f0fdf4',
            color: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            ✓
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '4px'
            }}>
              Position added successfully
            </div>
          </div>
          <button
            onClick={() => setShowSuccessModal(false)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && positionToDelete && (
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
              Are you sure you want to remove <strong>{positionToDelete.name}</strong>? This action cannot be undone.
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

      {/* Action Notification (Delete/Cancel) */}
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

      {/* Add/Edit Position Modal */}
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
            <h3>{editingPosition ? 'Edit Position' : 'Add New Position'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter position name"
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
                  {editingPosition ? 'Update Position' : 'Add Position'}
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

export default Position;

