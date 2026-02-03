import React, { useState, useEffect } from 'react';
import API_URL from './config';

function Program() {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success'); // 'success', 'error', or 'info'
  const [editingProgram, setEditingProgram] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [offices, setOffices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [expandedPrograms, setExpandedPrograms] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('all'); // 'all', 'code', 'description', 'office'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'code', 'description', 'office'
  const [formData, setFormData] = useState({
    programId: '',
    name: '',
    description: '',
    officeId: ''
  });

  // Fetch programs, offices, and employees from backend on component mount
  useEffect(() => {
    fetchPrograms();
    fetchOffices();
    fetchEmployees();
  }, []);

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

  const fetchOffices = async () => {
    try {
      const response = await fetch(`${API_URL}/offices`);
      const data = await response.json();
      setOffices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching offices:', error);
      setOffices([]);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employees`);
      const data = await response.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  // Toggle program expansion
  const toggleProgram = (programId) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  // Get employees for a specific program
  const getEmployeesForProgram = (programId) => {
    return employees.filter(emp => {
      const empProgramId = emp.program?._id || emp.program?.id;
      return empProgramId === programId;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to clean program names (remove [UPDATED])
  const cleanName = (name) => {
    if (!name) return name;
    return name.replace(/\s*\[UPDATED\]\s*/gi, '').trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Auto-generate programId if it's empty (for new programs)
    const programIdToUse = formData.programId || `PROG${Date.now()}`;
    
    // Clean the name field before saving (remove [UPDATED])
    const cleanedName = cleanName(formData.name);
    
    // Check for duplicate program names (only when adding new program)
    if (!editingProgram) {
      const duplicateProgram = programs.find(program => 
        cleanName(program.name).toLowerCase() === cleanedName.toLowerCase()
      );
      
      if (duplicateProgram) {
        setShowNotification(true);
        setNotificationMessage(`Program "${cleanedName}" already exists!`);
        setNotificationType('error');
        setTimeout(() => setShowNotification(false), 3000);
        return; // Stop submission
      }
    }
    
    const cleanedFormData = {
      ...formData,
      programId: programIdToUse,
      name: cleanedName
    };
    
    try {
      if (editingProgram) {
        // Update existing program
        const response = await fetch(`${API_URL}/programs/${editingProgram._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanedFormData),
        });
        
        if (response.ok) {
          setShowNotification(true);
          setNotificationMessage('Program updated successfully');
          setNotificationType('success');
          fetchPrograms(); // Refresh the list
          setTimeout(() => setShowNotification(false), 3000);
        } else {
          setShowNotification(true);
          setNotificationMessage('Failed to update program');
          setNotificationType('error');
          setTimeout(() => setShowNotification(false), 3000);
        }
      } else {
        // Add new program
        const response = await fetch(`${API_URL}/programs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanedFormData),
        });
        
        if (response.ok) {
          setShowNotification(true);
          setNotificationMessage('Program added successfully');
          setNotificationType('success');
          fetchPrograms(); // Refresh the list
          setTimeout(() => setShowNotification(false), 3000);
        } else {
          setShowNotification(true);
          setNotificationMessage('Failed to add program');
          setNotificationType('error');
          setTimeout(() => setShowNotification(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error saving program:', error);
      setShowNotification(true);
      setNotificationMessage('Error saving program');
      setNotificationType('error');
      setTimeout(() => setShowNotification(false), 3000);
    }
    
    // Reset form and close modal
    setFormData({
      programId: '',
      name: '',
      description: '',
      officeId: ''
    });
    setEditingProgram(null);
    setShowModal(false);
  };

  const handleEdit = (program) => {
    setEditingProgram(program);
    setFormData({
      programId: program.programId,
      name: cleanName(program.name), // Clean the name when editing
      description: program.description,
      officeId: program.officeId || ''
    });
    setShowModal(true);
  };

  const handleRemove = (programId) => {
    const program = programs.find(prog => prog._id === programId);
    setProgramToDelete({ id: programId, name: program?.name || 'this program' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!programToDelete) return;
    
    try {
      const response = await fetch(`${API_URL}/programs/${programToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setShowNotification(true);
        setNotificationMessage('Program removed successfully');
        setNotificationType('success');
        fetchPrograms(); // Refresh the list
        setTimeout(() => setShowNotification(false), 3000);
      } else {
        setShowNotification(true);
        setNotificationMessage('Failed to remove program');
        setNotificationType('error');
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      console.error('Error removing program:', error);
      setShowNotification(true);
      setNotificationMessage('Error removing program');
      setNotificationType('error');
      setTimeout(() => setShowNotification(false), 3000);
    }
    
    setShowDeleteModal(false);
    setProgramToDelete(null);
  };

  const cancelDelete = () => {
    setShowNotification(true);
    setNotificationMessage('Program deletion cancelled');
    setNotificationType('info');
    setTimeout(() => setShowNotification(false), 3000);
    
    setShowDeleteModal(false);
    setProgramToDelete(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProgram(null);
    setFormData({
      programId: '',
      name: '',
      description: '',
      officeId: ''
    });
  };

  // Filter and sort programs automatically
  const getFilteredAndSortedPrograms = () => {
    // Ensure programs is an array before filtering
    if (!Array.isArray(programs)) {
      return [];
    }
    
    // Filter based on searchBy field
    let filtered = programs.filter(program => {
      const searchLower = searchTerm.toLowerCase();
      
      if (!searchTerm) return true; // Show all if no search term
      
      switch (searchBy) {
        case 'code':
          return program.name?.toLowerCase().includes(searchLower) || '';
        case 'description':
          return program.description?.toLowerCase().includes(searchLower) || '';
        case 'office':
          const officeName = program.office?.name || '';
          return officeName.toLowerCase().includes(searchLower);
        case 'all':
        default:
          return (
            (program.name || '').toLowerCase().includes(searchLower) ||
            (program.description || '').toLowerCase().includes(searchLower) ||
            (program.office?.name || '').toLowerCase().includes(searchLower)
          );
      }
    });

    // Sort based on sortBy field
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'code':
          aValue = (a.name || '').toString().toLowerCase();
          bValue = (b.name || '').toString().toLowerCase();
          break;
        case 'description':
          aValue = (a.description || '').toString().toLowerCase();
          bValue = (b.description || '').toString().toLowerCase();
          break;
        case 'office':
          aValue = (a.office?.name || '').toLowerCase();
          bValue = (b.office?.name || '').toLowerCase();
          break;
        case 'name':
        default:
          aValue = (a.name || '').toString().toLowerCase();
          bValue = (b.name || '').toString().toLowerCase();
          break;
      }
      
      return aValue.localeCompare(bValue);
    });

    return filtered;
  };

  const filteredAndSortedPrograms = getFilteredAndSortedPrograms();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Program Management</h2>
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
          Add New Program
        </button>
      </div>

       {/* Search Bar with Filters */}
       <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
         <input
           type="text"
           placeholder="Search programs..."
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
           <option value="code">Search by: Code</option>
           <option value="description">Search by: Description</option>
           <option value="office">Search by: Office</option>
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
           <option value="code">Sort by: Code</option>
           <option value="description">Sort by: Description</option>
           <option value="office">Sort by: Office</option>
         </select>
       </div>
      
      {/* Program Table */}
      <div style={{ marginTop: '20px', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Code
                </th>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Description
                </th>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Office (Faculty)
                </th>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>Actions</th>
              </tr>
            </thead>
             <tbody>
               {filteredAndSortedPrograms.map((program) => {
                 const programId = program._id || program.id;
                 const isExpanded = expandedPrograms.has(programId);
                 const programEmployees = getEmployeesForProgram(programId);
                 const employeeCount = programEmployees.length;
                 
                 return (
                   <React.Fragment key={programId}>
                     <tr style={{ backgroundColor: 'white', cursor: 'pointer' }} onClick={() => toggleProgram(programId)}>
                       <td style={{ border: '1px solid #e0e0e0', padding: '12px', fontSize: '13px', fontWeight: '500', color: '#2c3e50' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <span style={{ fontSize: '12px', color: '#6c757d' }}>{isExpanded ? '▼' : '▶'}</span>
                           {cleanName(program.name)}
                         </div>
                       </td>
                       <td style={{ border: '1px solid #e0e0e0', padding: '12px', fontSize: '13px', color: '#2c3e50' }}>{program.description}</td>
                       <td style={{ border: '1px solid #e0e0e0', padding: '12px', fontSize: '13px', color: '#2c3e50' }}>
                         {program.office ? cleanName(program.office.name) : 'No Office'}
                       </td>
                       <td style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                         <div style={{ display: 'flex', gap: '5px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                           <span style={{
                             padding: '4px 8px',
                             borderRadius: '12px',
                             fontSize: '11px',
                             fontWeight: '600',
                             backgroundColor: '#fff3e0',
                             color: '#f57c00',
                             marginRight: '5px'
                           }}>
                             {employeeCount} {employeeCount === 1 ? 'Employee' : 'Employees'}
                           </span>
                           <button
                             onClick={() => handleEdit(program)}
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
                         </div>
                       </td>
                     </tr>
                     {isExpanded && (
                       <tr>
                         <td colSpan="4" style={{ border: '1px solid #e0e0e0', padding: '0', backgroundColor: '#f8f9fa' }}>
                           <div style={{ padding: '15px' }}>
                             {employeeCount > 0 ? (
                               <div>
                                 <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                                   Employees in {cleanName(program.name)}
                                 </h4>
                                 <div style={{ display: 'grid', gap: '10px' }}>
                                   {programEmployees.map((employee) => (
                                     <div
                                       key={employee._id || employee.id}
                                       style={{
                                         backgroundColor: 'white',
                                         padding: '12px',
                                         borderRadius: '6px',
                                         border: '1px solid #e0e0e0',
                                         display: 'flex',
                                         justifyContent: 'space-between',
                                         alignItems: 'center'
                                       }}
                                     >
                                       <div style={{ flex: 1 }}>
                                         <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                                           {employee.name}
                                         </div>
                                         <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                           <code style={{
                                             backgroundColor: '#f8f9fa',
                                             padding: '2px 6px',
                                             borderRadius: '3px',
                                             fontSize: '11px',
                                             marginRight: '10px'
                                           }}>
                                             {employee.employeeId}
                                           </code>
                                           <span style={{
                                             backgroundColor: '#e3f2fd',
                                             padding: '2px 8px',
                                             borderRadius: '4px',
                                             fontSize: '11px',
                                             color: '#1976d2',
                                             fontWeight: '500'
                                           }}>
                                             {employee.position}
                                           </span>
                                         </div>
                                       </div>
                                       {employee.office && (
                                         <div style={{
                                           backgroundColor: '#f3e5f5',
                                           padding: '4px 10px',
                                           borderRadius: '4px',
                                           fontSize: '11px',
                                           color: '#7b1fa2',
                                           fontWeight: '500'
                                         }}>
                                           {cleanName(employee.office.name)}
                                         </div>
                                       )}
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             ) : (
                               <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '13px', fontStyle: 'italic' }}>
                                 No employees assigned to this program yet.
                               </div>
                             )}
                           </div>
                         </td>
                       </tr>
                     )}
                   </React.Fragment>
                 );
               })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && programToDelete && (
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
              Are you sure you want to remove <strong>{programToDelete.name}</strong>? This action cannot be undone.
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

      {/* Add/Edit Program Modal */}
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
            <h3>{editingProgram ? 'Edit Program' : 'Add New Program'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Code:</label>
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
                <label style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter description"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Office (Faculty):</label>
                <select
                  name="officeId"
                  value={formData.officeId}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Select Office</option>
                  {offices.map((office) => (
                    <option key={office._id} value={office._id}>
                      {cleanName(office.name)} - {office.department}
                    </option>
                  ))}
                </select>
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
                  {editingProgram ? 'Update Program' : 'Add Program'}
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

export default Program;

