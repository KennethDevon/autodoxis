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
  const [programs, setPrograms] = useState([]);
  const [positions, setPositions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('all'); // 'all', 'id', 'name', 'position', 'office'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'id', 'position', 'office'
  const [collapsedDepartments, setCollapsedDepartments] = useState({});
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    middleInitial: '',
    lastName: '',
    position: '',
    department: '',
    officeId: '',
    programId: ''
  });

  // Fetch employees, offices, programs, and positions from backend on component mount
  useEffect(() => {
    fetchEmployees();
    fetchOffices();
    fetchPrograms();
    fetchPositions();
  }, []);

  // Collapse all departments by default when employees/offices are loaded
  useEffect(() => {
    if (offices.length > 0 || employees.length > 0) {
      const allDepartments = {};
      
      // Initialize all offices as collapsed
      offices.forEach(office => {
        const deptName = cleanName(office.name);
        if (deptName) {
          allDepartments[deptName] = true; // true means collapsed (hidden)
        }
      });
      
      // Also include departments from employees (for unassigned or custom departments)
      employees.forEach(employee => {
        const rawDeptName = employee.office?.name || employee.department || 'Unassigned';
        const deptName = cleanName(rawDeptName);
        if (deptName && !allDepartments.hasOwnProperty(deptName)) {
          allDepartments[deptName] = true; // true means collapsed (hidden)
        }
      });
      
      // Only update if we haven't set it yet (preserve user's manual toggles)
      setCollapsedDepartments(prev => {
        // If prev is empty, initialize with all collapsed
        if (Object.keys(prev).length === 0) {
          return allDepartments;
        }
        // Otherwise, merge new departments but keep existing state
        return { ...allDepartments, ...prev };
      });
    }
  }, [employees, offices]); // Run when employees or offices array changes

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employees`);
      const data = await response.json();
      // Ensure data is always an array
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]); // Set empty array on error
    }
  };

  const fetchOffices = async () => {
    try {
      const response = await fetch(`${API_URL}/offices`);
      const data = await response.json();
      // Ensure data is always an array
      setOffices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching offices:', error);
      setOffices([]); // Set empty array on error
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await fetch(`${API_URL}/programs`);
      const data = await response.json();
      // Ensure data is always an array
      setPrograms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setPrograms([]); // Set empty array on error
    }
  };

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
    
    // If office is selected, automatically set the department and reset program
    if (name === 'officeId' && value) {
      const selectedOffice = offices.find(office => (office._id === value || office.id === value));
      setFormData(prev => ({
        ...prev,
        [name]: value,
        department: selectedOffice ? selectedOffice.name : '',
        programId: '' // Reset program when office changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Filter programs based on selected office
  const getFilteredPrograms = () => {
    if (!formData.officeId) {
      return programs; // Show all programs if no office is selected
    }
    
    // Filter programs that belong to the selected office
    return programs.filter(program => {
      // Get the program's office ID from various possible locations
      const programOfficeId = program.officeId || 
                              program.office?._id || 
                              program.office?.id;
      
      // Get the selected office ID
      const selectedOfficeId = formData.officeId;
      
      // Compare both string and number formats to handle type mismatches
      return programOfficeId && String(programOfficeId) === String(selectedOfficeId);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Combine first name, middle initial, and last name
      const fullName = `${formData.firstName}${formData.middleInitial ? ' ' + formData.middleInitial + '.' : ''} ${formData.lastName}`.trim();
      
      // Ensure role is set to Employee for all employees
      const employeeData = {
        ...formData,
        name: fullName,
        role: 'Employee'
      };
      
      if (editingEmployee) {
        // Update existing employee
        const employeeId = editingEmployee._id || editingEmployee.id;
        const response = await fetch(`${API_URL}/employees/${employeeId}`, {
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
            officeId: '',
            programId: ''
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
        officeId: '',
        programId: ''
      });
      setEditingEmployee(null);
      setShowModal(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    
    // Split the name into firstName, middleInitial, and lastName
    const nameParts = (employee.name || '').split(' ');
    let firstName = '';
    let middleInitial = '';
    let lastName = '';
    
    if (nameParts.length === 1) {
      firstName = nameParts[0];
    } else if (nameParts.length === 2) {
      firstName = nameParts[0];
      lastName = nameParts[1];
    } else if (nameParts.length >= 3) {
      firstName = nameParts[0];
      // Check if middle part is an initial (single letter with or without period)
      const middlePart = nameParts[1];
      if (middlePart.length <= 2 && middlePart.replace('.', '').length === 1) {
        middleInitial = middlePart.replace('.', '');
        lastName = nameParts.slice(2).join(' ');
      } else {
        // Middle part is a full name, treat as part of first name or last name
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      }
    }
    
    setFormData({
      employeeId: employee.employeeId,
      firstName: firstName,
      middleInitial: middleInitial,
      lastName: lastName,
      position: employee.position,
      department: employee.department,
      officeId: employee.office?._id || employee.office?.id || '',
      programId: employee.program?._id || employee.program?.id || ''
    });
    setShowModal(true);
  };

  const handleRemove = (employeeId) => {
    const employee = employees.find(emp => (emp._id === employeeId || emp.id === employeeId));
    const idToUse = employee?._id || employee?.id || employeeId;
    setEmployeeToDelete({ id: idToUse, name: employee?.name || 'this employee' });
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
      firstName: '',
      middleInitial: '',
      lastName: '',
      position: '',
      department: '',
      officeId: '',
      programId: ''
    });
  };

  // Filter and sort employees automatically
  const getFilteredAndSortedEmployees = () => {
    // Ensure employees is an array before filtering
    if (!Array.isArray(employees)) {
      return [];
    }
    
    // Filter based on searchBy field
    let filtered = employees.filter(employee => {
      const searchLower = searchTerm.toLowerCase();
      
      if (!searchTerm) return true; // Show all if no search term
      
      switch (searchBy) {
        case 'id':
          return employee.employeeId.toLowerCase().includes(searchLower);
        case 'name':
          return employee.name.toLowerCase().includes(searchLower);
        case 'position':
          return employee.position.toLowerCase().includes(searchLower);
        case 'office':
          const officeName = employee.office?.name || employee.department || '';
          return officeName.toLowerCase().includes(searchLower);
        case 'program':
          const programName = employee.program?.name || '';
          return programName.toLowerCase().includes(searchLower);
        case 'all':
        default:
          return (
            employee.employeeId.toLowerCase().includes(searchLower) ||
            employee.name.toLowerCase().includes(searchLower) ||
            employee.position.toLowerCase().includes(searchLower) ||
            employee.department.toLowerCase().includes(searchLower) ||
            (employee.office?.name || '').toLowerCase().includes(searchLower) ||
            (employee.program?.name || '').toLowerCase().includes(searchLower)
          );
      }
    });

    // Sort based on sortBy field
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'id':
          aValue = a.employeeId?.toString().toLowerCase() || '';
          bValue = b.employeeId?.toString().toLowerCase() || '';
          break;
        case 'position':
          aValue = a.position?.toString().toLowerCase() || '';
          bValue = b.position?.toString().toLowerCase() || '';
          break;
        case 'office':
          aValue = (a.office?.name || a.department || '').toLowerCase();
          bValue = (b.office?.name || b.department || '').toLowerCase();
          break;
        case 'program':
          aValue = (a.program?.name || '').toLowerCase();
          bValue = (b.program?.name || '').toLowerCase();
          break;
        case 'name':
        default:
          aValue = a.name?.toString().toLowerCase() || '';
          bValue = b.name?.toString().toLowerCase() || '';
          break;
      }
      
      return aValue.localeCompare(bValue);
    });

    return filtered;
  };

  // Helper function to clean office/department names (remove [UPDATED])
  const cleanName = (name) => {
    if (!name) return name;
    return name.replace(/\s*\[UPDATED\]\s*/gi, '').trim();
  };

  // Group employees by department - include all offices even if they have no employees
  const groupEmployeesByDepartment = () => {
    const filtered = getFilteredAndSortedEmployees();
    const grouped = {};
    
    // First, initialize all offices/departments with empty arrays
    offices.forEach(office => {
      const deptName = cleanName(office.name);
      if (deptName && !grouped[deptName]) {
        grouped[deptName] = [];
      }
    });
    
    // Then, add employees to their respective departments
    filtered.forEach(employee => {
      const rawDeptName = employee.office?.name || employee.department || 'Unassigned';
      const deptName = cleanName(rawDeptName);
      if (!grouped[deptName]) {
        grouped[deptName] = [];
      }
      grouped[deptName].push(employee);
    });
    
    // Also include "Unassigned" if there are employees without offices
    const unassignedEmployees = filtered.filter(emp => !emp.office && !emp.department);
    if (unassignedEmployees.length > 0) {
      grouped['Unassigned'] = unassignedEmployees;
    }
    
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

      {/* Search Bar with Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px'
          }}
        />

        <select
          value={searchBy}
          onChange={(e) => setSearchBy(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'white',
            cursor: 'pointer',
            minWidth: '150px'
          }}
        >
          <option value="all">Search by: All</option>
          <option value="id">Search by: ID</option>
          <option value="name">Search by: Name</option>
          <option value="position">Search by: Position</option>
          <option value="office">Search by: Office</option>
          <option value="program">Search by: Program</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'white',
            cursor: 'pointer',
            minWidth: '150px'
          }}
        >
          <option value="name">Sort by: Name</option>
          <option value="id">Sort by: ID</option>
          <option value="position">Sort by: Position</option>
          <option value="office">Sort by: Office</option>
          <option value="program">Sort by: Program</option>
        </select>
      </div>
      
      {/* Employee Table */}
      <div style={{ marginTop: '20px', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Employee ID
                </th>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Name
                </th>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Position
                </th>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Office
                </th>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Program
                </th>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedEmployees.map((employee) => (
                <tr key={employee._id || employee.id} style={{ backgroundColor: 'white' }}>
                  <td style={{ border: '1px solid #e0e0e0', padding: '12px', fontSize: '13px', color: '#2c3e50' }}>
                    <code style={{
                      backgroundColor: '#f8f9fa',
                      padding: '2px 5px',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#6c757d'
                    }}>
                      {employee.employeeId}
                    </code>
                  </td>
                  <td style={{ border: '1px solid #e0e0e0', padding: '12px', fontSize: '13px', fontWeight: '500', color: '#2c3e50' }}>
                    {employee.name}
                  </td>
                  <td style={{ border: '1px solid #e0e0e0', padding: '12px', fontSize: '13px', color: '#2c3e50' }}>
                    {employee.position}
                  </td>
                  <td style={{ border: '1px solid #e0e0e0', padding: '12px', fontSize: '13px', color: '#2c3e50' }}>
                    {employee.office ? (
                      <span style={{ 
                        backgroundColor: '#e3f2fd', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#1976d2',
                        fontWeight: '500'
                      }}>
                        {cleanName(employee.office.name)}
                      </span>
                    ) : (
                      <span style={{ color: '#999', fontStyle: 'italic', fontSize: '12px' }}>Not assigned</span>
                    )}
                  </td>
                  <td style={{ border: '1px solid #e0e0e0', padding: '12px', fontSize: '13px', color: '#2c3e50' }}>
                    {employee.program ? (
                      <span style={{ 
                        backgroundColor: '#fff3e0', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#f57c00',
                        fontWeight: '500'
                      }}>
                        {cleanName(employee.program.name)}
                      </span>
                    ) : (
                      <span style={{ color: '#999', fontStyle: 'italic', fontSize: '12px' }}>No program</span>
                    )}
                  </td>
                  <td style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleEdit(employee)}
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
                        onClick={() => handleRemove(employee._id || employee.id)}
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
              ))}
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
                <label style={{ display: 'block', marginBottom: '5px' }}>First Name:</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Middle Initial:</label>
                <input
                  type="text"
                  name="middleInitial"
                  value={formData.middleInitial}
                  onChange={handleInputChange}
                  maxLength="1"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Last Name:</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
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
                  {positions.map((position) => (
                    <option key={position._id || position.id} value={position.name}>
                      {position.name}
                    </option>
                  ))}
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
                    <option key={office._id || office.id} value={office._id || office.id}>
                      {office.name} ({office.department})
                    </option>
                  ))}
                </select>
                <small style={{ color: '#666', fontSize: '12px' }}>The employee will be assigned to this office</small>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Program:</label>
                <select
                  name="programId"
                  value={formData.programId}
                  onChange={handleInputChange}
                  disabled={!formData.officeId}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    backgroundColor: !formData.officeId ? '#f5f5f5' : 'white',
                    cursor: !formData.officeId ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">
                    {formData.officeId ? 'Select Program (Optional)' : 'Select Office first'}
                  </option>
                    {getFilteredPrograms().map((program) => (
                    <option key={program._id || program.id} value={program._id || program.id}>
                      {program.name} - {program.description}
                    </option>
                  ))}
                </select>
                <small style={{ color: '#666', fontSize: '12px' }}>
                  {formData.officeId 
                    ? 'Optional: Assign employee to a specific program from this office' 
                    : 'Please select an office first to see available programs'}
                </small>
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
