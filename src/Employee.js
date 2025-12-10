import React, { useState, useEffect } from 'react';
import API_URL from './config';

function Employee() {
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success'); // 'success' or 'info'
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [offices, setOffices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedDepartments, setCollapsedDepartments] = useState({});
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    position: '',
    department: '',
    officeId: ''
  });

  // Fetch employees and offices from backend on component mount
  useEffect(() => {
    fetchEmployees();
    fetchOffices();
  }, []);

  // Collapse all departments by default when employees are loaded
  useEffect(() => {
    if (employees.length > 0) {
      const allDepartments = {};
      employees.forEach(employee => {
        const deptName = employee.office?.name || employee.department || 'Unassigned';
        allDepartments[deptName] = true; // true means collapsed
      });
      setCollapsedDepartments(allDepartments);
    }
  }, [employees]); // Run when employees array changes

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employees`);
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

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
    
    // If office is selected, automatically set the department
    if (name === 'officeId' && value) {
      const selectedOffice = offices.find(office => office._id === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        department: selectedOffice ? selectedOffice.name : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Ensure role is set to Employee for all employees
      const employeeData = {
        ...formData,
        role: 'Employee'
      };
      
      if (editingEmployee) {
        // Update existing employee
        const response = await fetch(`${API_URL}/employees/${editingEmployee._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(employeeData),
        });
        
        if (response.ok) {
          // Update office assignment if office was changed
          if (formData.officeId) {
            try {
              await fetch(`${API_URL}/offices/${formData.officeId}/assign-employee`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ employeeId: editingEmployee._id }),
              });
            } catch (officeError) {
              console.error('Error assigning employee to office:', officeError);
            }
          }
          
          alert('Employee updated successfully!');
          fetchEmployees(); // Refresh the list
        } else {
          const errorData = await response.json();
          const errorMessage = errorData.message || 'Failed to update employee';
          alert(`Failed to update employee: ${errorMessage}`);
        }
      } else {
        // Add new employee
        const response = await fetch(`${API_URL}/employees`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(employeeData),
        });
        
        if (response.ok) {
          const newEmployee = await response.json();
          
          // Assign employee to office if an office was selected
          if (formData.officeId) {
            try {
              await fetch(`${API_URL}/offices/${formData.officeId}/assign-employee`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ employeeId: newEmployee._id }),
              });
            } catch (officeError) {
              console.error('Error assigning employee to office:', officeError);
            }
          }
          
          // Reset form and close add employee modal
          setFormData({
            employeeId: '',
            name: '',
            position: '',
            department: '',
            officeId: ''
          });
          setEditingEmployee(null);
          setShowModal(false);
          
          // Show success notification
          setShowSuccessModal(true);
          
          // Auto-close after 3 seconds
          setTimeout(() => {
            setShowSuccessModal(false);
          }, 3000);
          
          fetchEmployees(); // Refresh the list
        } else {
          const errorData = await response.json();
          const errorMessage = errorData.message || 'Failed to add employee';
          alert(`Failed to add employee: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      alert(`Error saving employee: ${error.message || 'Network error. Please check your connection and try again.'}`);
    }
    
    // Reset form and close modal (for edit case)
    if (editingEmployee) {
      setFormData({
        employeeId: '',
        name: '',
        position: '',
        department: '',
        officeId: ''
      });
      setEditingEmployee(null);
      setShowModal(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      employeeId: employee.employeeId,
      name: employee.name,
      position: employee.position,
      department: employee.department,
      officeId: employee.office?._id || ''
    });
    setShowModal(true);
  };

  const handleRemove = (employeeId) => {
    const employee = employees.find(emp => emp._id === employeeId);
    setEmployeeToDelete({ id: employeeId, name: employee?.name || 'this employee' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    
    try {
      const response = await fetch(`${API_URL}/employees/${employeeToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setShowNotification(true);
        setNotificationMessage('Employee removed successfully');
        setNotificationType('success');
        fetchEmployees(); // Refresh the list
        
        // Auto-close notification after 3 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
      } else {
        setShowNotification(true);
        setNotificationMessage('Failed to remove employee');
        setNotificationType('error');
        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error removing employee:', error);
      setShowNotification(true);
      setNotificationMessage('Error removing employee');
      setNotificationType('error');
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    }
    
    setShowDeleteModal(false);
    setEmployeeToDelete(null);
  };

  const cancelDelete = () => {
    setShowNotification(true);
    setNotificationMessage('Employee deletion cancelled');
    setNotificationType('info');
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
    
    setShowDeleteModal(false);
    setEmployeeToDelete(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setFormData({
      employeeId: '',
      name: '',
      position: '',
      department: '',
      officeId: ''
    });
  };

  // Filter and sort employees automatically
  const getFilteredAndSortedEmployees = () => {
    let filtered = employees.filter(employee =>
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Automatically sort by employee name (alphabetically)
    filtered.sort((a, b) => {
      const aValue = a.name?.toString().toLowerCase() || '';
      const bValue = b.name?.toString().toLowerCase() || '';
      return aValue.localeCompare(bValue);
    });

    return filtered;
  };

  // Group employees by department
  const groupEmployeesByDepartment = () => {
    const filtered = getFilteredAndSortedEmployees();
    const grouped = {};
    
    filtered.forEach(employee => {
      const deptName = employee.office?.name || employee.department || 'Unassigned';
      if (!grouped[deptName]) {
        grouped[deptName] = [];
      }
      grouped[deptName].push(employee);
    });
    
    return grouped;
  };

  // Toggle department collapse state
  const toggleDepartment = (deptName) => {
    setCollapsedDepartments(prev => ({
      ...prev,
      [deptName]: !prev[deptName]
    }));
  };

  // eslint-disable-next-line no-unused-vars
  const filteredAndSortedEmployees = getFilteredAndSortedEmployees();
  const groupedEmployees = groupEmployeesByDepartment();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Employee Management</h2>
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
          Add New Employee
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search employees by ID, name, position, or department..."
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
      
      {/* Grouped Employee List by Department */}
      <div style={{ marginTop: '20px' }}>
        {Object.keys(groupedEmployees).sort().map((deptName) => {
          const deptEmployees = groupedEmployees[deptName];
          const isCollapsed = collapsedDepartments[deptName];
          
          return (
            <div key={deptName} style={{ marginBottom: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
              {/* Department Header */}
              <div
                onClick={() => toggleDepartment(deptName)}
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '15px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: isCollapsed ? 'none' : '1px solid #e0e0e0',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '18px', transition: 'transform 0.3s ease', display: 'inline-block', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                    ▼
                  </span>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
                    {deptName}
                  </h3>
                  <span style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    {deptEmployees.length} {deptEmployees.length === 1 ? 'employee' : 'employees'}
                  </span>
                </div>
              </div>

              {/* Employee Table for this Department */}
              {!isCollapsed && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fafafa' }}>
                      <th style={{ border: '1px solid #e0e0e0', padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>
                        Employee ID
                      </th>
                      <th style={{ border: '1px solid #e0e0e0', padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>
                        Name
                      </th>
                      <th style={{ border: '1px solid #e0e0e0', padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>
                        Position
                      </th>
                      <th style={{ border: '1px solid #e0e0e0', padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>
                        Office/Department
                      </th>
                      <th style={{ border: '1px solid #e0e0e0', padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptEmployees.map((employee) => (
                      <tr key={employee._id} style={{ backgroundColor: 'white' }}>
                        <td style={{ border: '1px solid #e0e0e0', padding: '10px' }}>{employee.employeeId}</td>
                        <td style={{ border: '1px solid #e0e0e0', padding: '10px', fontWeight: '500' }}>{employee.name}</td>
                        <td style={{ border: '1px solid #e0e0e0', padding: '10px' }}>{employee.position}</td>
                        <td style={{ border: '1px solid #e0e0e0', padding: '10px' }}>
                          {employee.office ? (
                            <span style={{ 
                              backgroundColor: '#e3f2fd', 
                              padding: '4px 8px', 
                              borderRadius: '4px',
                              fontSize: '13px',
                              color: '#1976d2',
                              fontWeight: '500'
                            }}>
                              {employee.office.name}
                            </span>
                          ) : (
                            <span style={{ color: '#999', fontStyle: 'italic', fontSize: '13px' }}>Not assigned</span>
                          )}
                        </td>
                        <td style={{ border: '1px solid #e0e0e0', padding: '10px' }}>
                          <button
                            onClick={() => handleEdit(employee)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#ffc107',
                              color: 'black',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              marginRight: '5px',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemove(employee._id)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
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
              Employee added successfully
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
      {showDeleteModal && employeeToDelete && (
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
              Are you sure you want to remove <strong>{employeeToDelete.name}</strong>? This action cannot be undone.
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

      {/* Add/Edit Employee Modal */}
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
            <h3>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Employee ID:</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
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
                <label style={{ display: 'block', marginBottom: '5px' }}>Position:</label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Select Position</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Program Head">Program Head</option>
                  <option value="Dean">Dean</option>
                  <option value="VP">VP</option>
                  <option value="Academic VP">Academic VP</option>
                  <option value="OP">OP</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Office/Department:</label>
                <select
                  name="officeId"
                  value={formData.officeId}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Select Office</option>
                  {offices.map((office) => (
                    <option key={office._id} value={office._id}>
                      {office.name} ({office.department})
                    </option>
                  ))}
                </select>
                <small style={{ color: '#666', fontSize: '12px' }}>The employee will be assigned to this office</small>
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
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
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

export default Employee;
