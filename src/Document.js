import React, { useState, useEffect } from 'react';
import QRCodeDisplay from './components/QRCodeDisplay';
import BarcodeDisplay from './components/BarcodeDisplay';
import DocumentTracker from './components/DocumentTracker';
import AdvancedSearch from './components/AdvancedSearch';
import DelayAlerts from './components/DelayAlerts';
import DocumentTrackingTimeline from './components/DocumentTrackingTimeline';
import { showNotification } from './components/NotificationSystem';
import API_URL from './config';

function Document() {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [documentToApprove, setDocumentToApprove] = useState(null);
  const [showNotificationPane, setShowNotificationPane] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success'); // 'success', 'error', or 'info'
  const [editingDocument, setEditingDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQRCode, setShowQRCode] = useState(null);
  const [showBarcode, setShowBarcode] = useState(null);
  const [showTracker, setShowTracker] = useState(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showDelayAlerts, setShowDelayAlerts] = useState(false);
  const [showTrackingTimeline, setShowTrackingTimeline] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [offices, setOffices] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [selectedOfficeForForm, setSelectedOfficeForForm] = useState('');
  const [filteredEmployeesForForm, setFilteredEmployeesForForm] = useState([]);
  const [forwardType, setForwardType] = useState('office'); // 'office' or 'employee'
  const [forwardComments, setForwardComments] = useState('');
  const [expandedDocuments, setExpandedDocuments] = useState(new Set());
  const [formData, setFormData] = useState({
    sender: '',
    type: '',
    date: '',
    time: '',
    notes: '',
    attachment: null,
    receiver: ''
  });

  const toggleDocument = (documentId) => {
    const newExpanded = new Set(expandedDocuments);
    if (newExpanded.has(documentId)) {
      newExpanded.delete(documentId);
    } else {
      newExpanded.add(documentId);
    }
    setExpandedDocuments(newExpanded);
  };

  // Fetch documents, employees, offices, and document types from backend on component mount
  useEffect(() => {
    fetchDocuments();
    fetchEmployees();
    fetchOffices();
    fetchDocumentTypes();
    
    // Auto-fill sender from localStorage if available
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      setFormData(prev => ({
        ...prev,
        sender: user.username || ''
      }));
    }
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_URL}/documents`);
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

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

  const fetchDocumentTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/document-types`);
      const data = await response.json();
      setDocumentTypes(data);
    } catch (error) {
      console.error('Error fetching document types:', error);
      // Fallback to default types if API fails
      setDocumentTypes(['Report', 'Memo', 'Letter', 'Contract', 'Invoice', 'Certificate', 'Other']);
    }
  };

  const handleDocumentInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOfficeChangeForForm = (officeName) => {
    setSelectedOfficeForForm(officeName);
    setFormData(prev => ({
      ...prev,
      receiver: '' // Clear receiver when office changes
    }));
    if (officeName) {
      // Filter employees by office/department
      const filtered = employees.filter(emp => 
        emp.office?.name === officeName || emp.department === officeName
      );
      setFilteredEmployeesForForm(filtered);
    } else {
      setFilteredEmployeesForForm([]);
    }
  };

  const handleEmployeeChangeForForm = (employeeName) => {
    setFormData(prev => ({
      ...prev,
      receiver: employeeName
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      attachment: file
    }));
  };

  const handleSubmitDocument = async () => {
    try {
      // Generate unique document ID
      const generateDocumentId = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `DOC${timestamp.toString().slice(-6)}${random}`;
      };

      // Find the selected employee
      const selectedEmployeeObj = filteredEmployeesForForm.find(emp => emp.name === formData.receiver);

      // Combine date and time
      const dateTimeString = formData.date && formData.time 
        ? `${formData.date}T${formData.time}:00`
        : new Date().toISOString();

      // Prepare document data matching backend schema
      const documentData = {
        documentId: editingDocument ? editingDocument.documentId : generateDocumentId(),
        name: formData.attachment ? formData.attachment.name : `Document_${new Date().toISOString().split('T')[0]}`,
        type: formData.type || 'Report',
        description: formData.notes || '',
        submittedBy: formData.sender || 'Admin',
        status: selectedEmployeeObj ? 'Under Review' : 'Submitted',
        dateUploaded: dateTimeString,
        reviewer: '',
        reviewDate: null,
        comments: '',
        filePath: formData.attachment ? formData.attachment.name : '',
        nextOffice: selectedEmployeeObj ? selectedEmployeeObj.position : '',
        currentOffice: selectedEmployeeObj ? selectedEmployeeObj.position : '',
        assignedTo: selectedEmployeeObj ? [selectedEmployeeObj._id] : [],
        currentHandler: selectedEmployeeObj ? selectedEmployeeObj._id : null,
        forwardedBy: formData.sender || 'Admin',
        forwardedDate: selectedEmployeeObj ? new Date().toISOString() : null
      };

      if (editingDocument) {
        // Update existing document
        const response = await fetch(`${API_URL}/documents/${editingDocument._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(documentData),
        });
        
        if (response.ok) {
          showNotification('success', 'Document Updated', 'Document updated successfully!');
          fetchDocuments();
        } else {
          showNotification('error', 'Update Failed', 'Failed to update document');
        }
      } else {
        // Add new document
        const response = await fetch(`${API_URL}/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(documentData),
        });
        
        if (response.ok) {
          showNotification('success', 'Document Added', 'Document added successfully!');
          fetchDocuments();
        } else {
          showNotification('error', 'Add Failed', 'Failed to add document');
        }
      }
      
      // Reset form and close modal
      setFormData({
        sender: formData.sender, // Keep sender
        type: '',
        date: '',
        time: '',
        notes: '',
        attachment: null,
        receiver: ''
      });
      setSelectedOfficeForForm('');
      setFilteredEmployeesForForm([]);
      setEditingDocument(null);
      setShowModal(false);
    } catch (error) {
      console.error('Error saving document:', error);
      showNotification('error', 'Error', 'Error saving document');
    }
  };

  const handleEdit = async (document) => {
    setEditingDocument(document);
    const uploadDate = document.dateUploaded ? new Date(document.dateUploaded) : null;
    
    // Set the form data
    setFormData({
      sender: document.submittedBy || 'Admin',
      type: document.type || '',
      date: uploadDate ? uploadDate.toISOString().split('T')[0] : '',
      time: uploadDate ? uploadDate.toTimeString().slice(0, 5) : '',
      notes: document.description || '',
      attachment: null,
      receiver: document.currentHandler ? '' : '' // Will need to find employee name
    });
    
    // Try to find and set the office/employee if available
    if (document.currentOffice || document.nextOffice) {
      const officeName = document.currentOffice || document.nextOffice;
      setSelectedOfficeForForm(officeName);
      
      // Fetch employees for this office
      try {
        const response = await fetch(`${API_URL}/employees`);
        const allEmployees = await response.json();
        const filtered = allEmployees.filter(emp => 
          emp.office?.name === officeName || emp.department === officeName
        );
        setFilteredEmployeesForForm(filtered);
        
        // Try to find the current handler employee
        if (document.currentHandler) {
          const handlerEmployee = allEmployees.find(emp => emp._id === document.currentHandler);
          if (handlerEmployee) {
            setFormData(prev => ({
              ...prev,
              receiver: handlerEmployee.name
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching employees for edit:', error);
      }
    }
    
    setShowModal(true);
  };

  const handleRemove = (documentId) => {
    const document = documents.find(doc => doc._id === documentId);
    setDocumentToDelete({ id: documentId, name: document?.name || 'this document' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    
      try {
      const response = await fetch(`${API_URL}/documents/${documentToDelete.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
        setShowNotificationPane(true);
        setNotificationMessage('Document removed successfully');
        setNotificationType('success');
          fetchDocuments(); // Refresh the list
        setTimeout(() => setShowNotificationPane(false), 3000);
        } else {
        setShowNotificationPane(true);
        setNotificationMessage('Failed to remove document');
        setNotificationType('error');
        setTimeout(() => setShowNotificationPane(false), 3000);
        }
      } catch (error) {
        console.error('Error removing document:', error);
      setShowNotificationPane(true);
      setNotificationMessage('Error removing document');
      setNotificationType('error');
      setTimeout(() => setShowNotificationPane(false), 3000);
    }
    
    setShowDeleteModal(false);
    setDocumentToDelete(null);
  };

  const cancelDelete = () => {
    setShowNotificationPane(true);
    setNotificationMessage('Document deletion cancelled');
    setNotificationType('info');
    setTimeout(() => setShowNotificationPane(false), 3000);
    
    setShowDeleteModal(false);
    setDocumentToDelete(null);
  };

  const handleApprove = (document) => {
    setDocumentToApprove(document);
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    if (!documentToApprove) return;

    try {
      const document = documentToApprove;
      const userData = localStorage.getItem('userData');
      const approverName = userData ? JSON.parse(userData).username || 'Admin' : 'Admin';

      const updateData = {
        status: 'Approved',
        reviewer: approverName,
        reviewDate: new Date().toISOString(),
        comments: `Approved by Admin (${approverName})`,
        nextOffice: '', // Clear next office - workflow complete
      };

      const response = await fetch(`${API_URL}/documents/${document._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        // Add routing history entry
        try {
          await fetch(`${API_URL}/documents/${document._id}/routing-history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              office: document.currentOffice || 'Admin',
              action: 'approved',
              handler: approverName,
              comments: `Final approval by Admin (${approverName})`
            }),
          });
        } catch (historyError) {
          console.error('Error adding routing history:', historyError);
          // Don't fail the approval if history fails
        }

        setShowNotificationPane(true);
        setNotificationMessage(`Document "${document.name}" has been approved successfully!`);
        setNotificationType('success');
        fetchDocuments(); // Refresh the list
        setTimeout(() => setShowNotificationPane(false), 3000);
      } else {
        const errorData = await response.json();
        setShowNotificationPane(true);
        setNotificationMessage(`Failed to approve document: ${errorData.message || 'Unknown error'}`);
        setNotificationType('error');
        setTimeout(() => setShowNotificationPane(false), 3000);
      }
    } catch (error) {
      console.error('Error approving document:', error);
      setShowNotificationPane(true);
      setNotificationMessage('Error approving document');
      setNotificationType('error');
      setTimeout(() => setShowNotificationPane(false), 3000);
    }
    
    setShowApproveModal(false);
    setDocumentToApprove(null);
  };

  const cancelApprove = () => {
    setShowNotificationPane(true);
    setNotificationMessage('Document approval cancelled');
    setNotificationType('info');
    setTimeout(() => setShowNotificationPane(false), 3000);
    
    setShowApproveModal(false);
    setDocumentToApprove(null);
  };

  const handleForward = async () => {
    if (forwardType === 'employee' && !selectedEmployee) {
      setShowNotificationPane(true);
      setNotificationMessage('Please select an employee');
      setNotificationType('error');
      setTimeout(() => setShowNotificationPane(false), 3000);
      return;
    }
    if (forwardType === 'office' && !selectedOffice) {
      setShowNotificationPane(true);
      setNotificationMessage('Please select an office');
      setNotificationType('error');
      setTimeout(() => setShowNotificationPane(false), 3000);
      return;
    }

    try {
      const userData = localStorage.getItem('userData');
      const forwardedBy = userData ? JSON.parse(userData).username || 'Admin' : 'Admin';

      if (forwardType === 'employee') {
        // Forward to employee
        const response = await fetch(`${API_URL}/documents/${showForwardModal._id}/forward-to-employee`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employeeId: selectedEmployee,
            forwardedBy: forwardedBy,
            comments: forwardComments
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setShowNotificationPane(true);
          setNotificationMessage(result.message || 'Document forwarded successfully');
          setNotificationType('success');
          fetchDocuments();
          setShowForwardModal(null);
          setSelectedEmployee('');
          setSelectedOffice('');
          setForwardComments('');
          setForwardType('office');
          setTimeout(() => setShowNotificationPane(false), 3000);
        } else {
          const error = await response.json();
          setShowNotificationPane(true);
          setNotificationMessage(`Failed to forward document: ${error.message}`);
          setNotificationType('error');
          setTimeout(() => setShowNotificationPane(false), 3000);
        }
      } else {
        // Forward to office
        const response = await fetch(`${API_URL}/documents/${showForwardModal._id}/forward`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reviewer: forwardedBy,
            nextOffice: selectedOffice,
            currentOffice: selectedOffice,
            comments: forwardComments || `Forwarded to ${selectedOffice} by ${forwardedBy}`,
            status: 'Processing'
          }),
        });

        if (response.ok) {
          setShowNotificationPane(true);
          setNotificationMessage(`Document forwarded to ${selectedOffice} successfully!`);
          setNotificationType('success');
          fetchDocuments();
          setShowForwardModal(null);
          setSelectedEmployee('');
          setSelectedOffice('');
          setForwardComments('');
          setForwardType('office');
          setTimeout(() => setShowNotificationPane(false), 3000);
        } else {
          const error = await response.json();
          setShowNotificationPane(true);
          setNotificationMessage(`Failed to forward document: ${error.message}`);
          setNotificationType('error');
          setTimeout(() => setShowNotificationPane(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error forwarding document:', error);
      setShowNotificationPane(true);
      setNotificationMessage('Error forwarding document');
      setNotificationType('error');
      setTimeout(() => setShowNotificationPane(false), 3000);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDocument(null);
    const userData = localStorage.getItem('userData');
    const sender = userData ? JSON.parse(userData).username || 'Admin' : 'Admin';
    setFormData({
      sender: sender,
      type: '',
      date: '',
      time: '',
      notes: '',
      attachment: null,
      receiver: ''
    });
    setSelectedOfficeForForm('');
    setFilteredEmployeesForForm([]);
  };

  const handleOpenDocumentModal = () => {
    const userData = localStorage.getItem('userData');
    const sender = userData ? JSON.parse(userData).username || 'Admin' : 'Admin';
    setFormData(prev => ({
      ...prev,
      sender: sender
    }));
    setShowModal(true);
  };

  // Filter and sort documents automatically
  const getFilteredAndSortedDocuments = () => {
    let filtered = documents.filter(document =>
      document.documentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Automatically sort by document name (alphabetically)
    filtered.sort((a, b) => {
      const aValue = a.name?.toString().toLowerCase() || '';
      const bValue = b.name?.toString().toLowerCase() || '';
      return aValue.localeCompare(bValue);
    });

    return filtered;
  };

  const filteredAndSortedDocuments = getFilteredAndSortedDocuments();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Document Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowDelayAlerts(true)}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#f39c12', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Delay Alerts
          </button>
          <button 
            onClick={() => setShowAdvancedSearch(true)}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#3498db', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Advanced Search
          </button>
          <button 
            onClick={handleOpenDocumentModal}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Add New Document
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search documents by ID, name, or type..."
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
      
      <div style={{ marginTop: '20px' }}>
        {filteredAndSortedDocuments.map((document) => {
          const isExpanded = expandedDocuments.has(document._id);
          
          return (
            <div key={document._id} style={{ 
              marginBottom: '10px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'white'
            }}>
              {/* Document Header - Always Visible */}
              <div
                onClick={() => toggleDocument(document._id)}
                style={{
                  padding: '15px 20px',
                  backgroundColor: isExpanded ? '#e3f2fd' : '#f8f9fa',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.2s ease',
                  borderBottom: isExpanded ? '1px solid #ddd' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isExpanded) e.currentTarget.style.backgroundColor = '#e9ecef';
                }}
                onMouseLeave={(e) => {
                  if (!isExpanded) e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                <span style={{
                    fontSize: '18px',
                    fontWeight: '500',
                    color: '#2c3e50'
                  }}>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '4px'
                    }}>
                      {document.name}
                    </div>
                    <div style={{ 
                      fontSize: '12px',
                      color: '#7f8c8d'
                    }}>
                      ID: {document.documentId}
                    </div>
                  </div>
                </div>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: 
                    document.status === 'Approved' ? '#d4edda' :
                    document.status === 'Under Review' ? '#fff3cd' :
                    document.status === 'Rejected' ? '#f8d7da' :
                    document.status === 'On Hold' ? '#e2e3e5' :
                    document.status === 'Processing' ? '#d1ecf1' :
                    '#e9ecef',
                  color: 
                    document.status === 'Approved' ? '#155724' :
                    document.status === 'Under Review' ? '#856404' :
                    document.status === 'Rejected' ? '#721c24' :
                    document.status === 'On Hold' ? '#383d41' :
                    document.status === 'Processing' ? '#0c5460' :
                    '#495057'
                }}>
                  {document.status || 'Submitted'}
                </span>
              </div>

              {/* Document Details - Shown when Expanded */}
              {isExpanded && (
                <div style={{ padding: '20px' }}>
                  {/* Document Information */}
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                    marginBottom: '20px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid #e9ecef'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>Type</div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                        {document.type ? document.type.split('.').pop().toUpperCase() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>Date Uploaded</div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                        {document.dateUploaded ? new Date(document.dateUploaded).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>Submitted By</div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                        {document.submittedBy || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingDocument(document);
                      }}
                  style={{
                        padding: '8px 16px',
                        backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                        borderRadius: '6px',
                    cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                  }}
                      onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                      View
                </button>
                <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(document);
                      }}
                  style={{
                        padding: '8px 16px',
                        backgroundColor: '#ffc107',
                        color: 'black',
                    border: 'none',
                        borderRadius: '6px',
                    cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                  }}
                      onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                      Edit
                </button>
                {document.status !== 'Approved' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(document);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.backgroundColor = '#229954';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.backgroundColor = '#27ae60';
                    }}
                  >
                    ✓ Approve
                  </button>
                )}
                <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowForwardModal(document);
                      }}
                  style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                        borderRadius: '6px',
                    cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                  }}
                      onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                      Forward
                </button>
                <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(document._id);
                      }}
                  style={{
                        padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                        borderRadius: '6px',
                    cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                  }}
                      onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                      Delete
                </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Document Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#7f8c8d',
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
                e.target.style.color = '#7f8c8d';
              }}
            >
              ×
            </button>

            {/* Modal Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '30px',
              paddingBottom: '20px',
              borderBottom: '2px solid #ecf0f1'
            }}>
              <h2 style={{
                margin: '0 0 5px 0',
                fontSize: '24px',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                {editingDocument ? 'Edit Document' : 'Add New Document'}
              </h2>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#7f8c8d'
              }}>
                Fill in the document details below
              </p>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Sender */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Sender *
                </label>
                <input
                  type="text"
                  value={formData.sender}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d'
                  }}
                />
              </div>

              {/* Type of Document */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Type of Document *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleDocumentInputChange('type', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select document type</option>
                  {documentTypes.map(type => (
                    <option key={type._id || type} value={type.name || type}>
                      {type.name || type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleDocumentInputChange('date', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Time *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleDocumentInputChange('time', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Receiver */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  To (Receiver) *
                </label>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#666'
                  }}>
                    Select Office:
                  </label>
                  <select
                    value={selectedOfficeForForm}
                    onChange={(e) => handleOfficeChangeForForm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Select Office</option>
                    {offices.map((office) => (
                      <option key={office._id} value={office.name}>
                        {office.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#666'
                  }}>
                    Select Employee:
                  </label>
                  <select
                    value={formData.receiver}
                    onChange={(e) => handleEmployeeChangeForForm(e.target.value)}
                    disabled={!selectedOfficeForForm}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: selectedOfficeForForm ? 'white' : '#f8f9fa',
                      cursor: selectedOfficeForForm ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <option value="">Select Employee</option>
                    {filteredEmployeesForForm.map((employee) => (
                      <option key={employee._id} value={employee.name}>
                        {employee.name} - {employee.position}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleDocumentInputChange('notes', e.target.value)}
                  placeholder="Enter any additional notes or comments"
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Attachment */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Attachment
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                {formData.attachment && (
                  <p style={{
                    margin: '8px 0 0 0',
                    fontSize: '12px',
                    color: '#27ae60'
                  }}>
                    Selected: {formData.attachment.name}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '2px solid #ecf0f1'
            }}>
              <button
                onClick={handleSubmitDocument}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#229954';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#27ae60';
                }}
              >
                {editingDocument ? 'Update Document' : 'Add Document'}
              </button>
              <button
                onClick={handleCloseModal}
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
            </div>
          </div>
        </div>
      )}

      {/* QR Code Display Modal */}
      {showQRCode && (
        <QRCodeDisplay
          documentId={showQRCode.id}
          documentName={showQRCode.name}
          onClose={() => setShowQRCode(null)}
        />
      )}

      {/* Barcode Display Modal */}
      {showBarcode && (
        <BarcodeDisplay
          documentId={showBarcode.id}
          documentName={showBarcode.name}
          onClose={() => setShowBarcode(null)}
        />
      )}

      {/* Document Tracker Modal */}
      {showTracker && (
        <DocumentTracker
          documentId={showTracker.id}
          documentName={showTracker.name}
          onClose={() => setShowTracker(null)}
        />
      )}

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <AdvancedSearch
          onSearch={(results) => {
            setDocuments(results);
            setShowAdvancedSearch(false);
          }}
          onClose={() => setShowAdvancedSearch(false)}
        />
      )}

      {/* Delay Alerts Dashboard */}
      {showDelayAlerts && (
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
          zIndex: 3000,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '30px',
            width: '95%',
            maxWidth: '1400px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowDelayAlerts(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#95a5a6',
                padding: '5px 10px',
                borderRadius: '50%',
                transition: 'all 0.3s ease',
                zIndex: 1
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
            <DelayAlerts />
          </div>
        </div>
      )}

      {/* Forward to Employee Modal */}
      {/* View Document Modal */}
      {viewingDocument && (
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
              <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '24px' }}>Document Details</h2>
              <button
                onClick={() => setViewingDocument(null)}
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
              {/* Document ID */}
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
                  Document ID
                </label>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  color: '#2c3e50',
                  fontWeight: '500'
                }}>
                  {viewingDocument.documentId}
                </div>
              </div>

              {/* Document Name */}
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
                  Document Name
                </label>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#2c3e50',
                  fontWeight: '500'
                }}>
                  {viewingDocument.name}
                </div>
              </div>

              {/* Type and Status */}
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
                    Type
                  </label>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#2c3e50',
                    fontWeight: '500'
                  }}>
                    {viewingDocument.type ? viewingDocument.type.split('.').pop().toUpperCase() : 'N/A'}
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
                    backgroundColor: 
                      viewingDocument.status === 'Approved' ? '#d4edda' :
                      viewingDocument.status === 'Under Review' ? '#fff3cd' :
                      viewingDocument.status === 'Rejected' ? '#f8d7da' :
                      viewingDocument.status === 'On Hold' ? '#e2e3e5' :
                      viewingDocument.status === 'Processing' ? '#d1ecf1' :
                      '#e9ecef',
                    color: 
                      viewingDocument.status === 'Approved' ? '#155724' :
                      viewingDocument.status === 'Under Review' ? '#856404' :
                      viewingDocument.status === 'Rejected' ? '#721c24' :
                      viewingDocument.status === 'On Hold' ? '#383d41' :
                      viewingDocument.status === 'Processing' ? '#0c5460' :
                      '#495057'
                  }}>
                    {viewingDocument.status || 'Submitted'}
                  </span>
                </div>
              </div>

              {/* Date and Submitted By */}
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
                    {viewingDocument.dateUploaded ? new Date(viewingDocument.dateUploaded).toLocaleDateString() : 'N/A'}
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
                    Submitted By
                  </label>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#2c3e50',
                    fontWeight: '500'
                  }}>
                    {viewingDocument.submittedBy || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewingDocument.description && (
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
                    {viewingDocument.description}
                  </div>
                </div>
              )}

              {/* Reviewer and Comments */}
              {(viewingDocument.reviewer || viewingDocument.comments) && (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {viewingDocument.reviewer && (
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
                        Reviewer
                      </label>
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#2c3e50',
                        fontWeight: '500'
                      }}>
                        {viewingDocument.reviewer}
                      </div>
                    </div>
                  )}
                  {viewingDocument.comments && (
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
                        Comments
                      </label>
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#2c3e50',
                        lineHeight: '1.6'
                      }}>
                        {viewingDocument.comments}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ 
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #e9ecef',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowQRCode({ id: viewingDocument._id, name: viewingDocument.name });
                  setViewingDocument(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
              >
                QR Code
              </button>
              <button
                onClick={() => {
                  setShowBarcode({ id: viewingDocument._id, name: viewingDocument.name });
                  setViewingDocument(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#5a32a3'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6f42c1'}
              >
                Barcode
              </button>
              <button
                onClick={() => {
                  setShowTracker({ id: viewingDocument._id, name: viewingDocument.name });
                  setViewingDocument(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#fd7e14',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e8590c'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#fd7e14'}
              >
                Track
              </button>
              <button
                onClick={() => {
                  setShowTrackingTimeline(viewingDocument._id);
                  setViewingDocument(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#117a8b'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#17a2b8'}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewingDocument(null)}
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

      {showForwardModal && (
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
            width: '550px',
            maxWidth: '90%'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Forward Document</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Document: <strong>{showForwardModal.name}</strong>
            </p>
            
            {/* Forward Type Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Forward To:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setForwardType('office');
                    setSelectedEmployee('');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: forwardType === 'office' ? '#007bff' : '#e9ecef',
                    color: forwardType === 'office' ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: forwardType === 'office' ? '600' : '400'
                  }}
                >
                  Office
                </button>
                <button
                  onClick={() => {
                    setForwardType('employee');
                    setSelectedOffice('');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: forwardType === 'employee' ? '#007bff' : '#e9ecef',
                    color: forwardType === 'employee' ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: forwardType === 'employee' ? '600' : '400'
                  }}
                >
                  Employee
                </button>
              </div>
            </div>

            {/* Office Selection */}
            {forwardType === 'office' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Select Office: <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={selectedOffice}
                  onChange={(e) => setSelectedOffice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">-- Select an office --</option>
                  {offices.map((office) => (
                    <option key={office._id} value={office.name}>
                      {office.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Employee Selection */}
            {forwardType === 'employee' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Select Employee: <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">-- Select an employee --</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name} - {employee.position} ({employee.office?.name || 'No office'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Comments (Optional):
              </label>
              <textarea
                value={forwardComments}
                onChange={(e) => setForwardComments(e.target.value)}
                placeholder="Add any comments or instructions..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowForwardModal(null);
                  setSelectedEmployee('');
                  setSelectedOffice('');
                  setForwardComments('');
                  setForwardType('office');
                }}
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
                onClick={handleForward}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Forward Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Tracking Timeline Modal */}
      {showTrackingTimeline && (
        <DocumentTrackingTimeline
          documentId={showTrackingTimeline}
          onClose={() => setShowTrackingTimeline(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && documentToDelete && (
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
              Are you sure you want to remove <strong>{documentToDelete.name}</strong>? This action cannot be undone.
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

      {/* Approve Confirmation Modal */}
      {showApproveModal && documentToApprove && (
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
        onClick={cancelApprove}
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
              Confirm Approval
            </div>
            <div style={{
              fontSize: '15px',
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Are you sure you want to approve <strong>"{documentToApprove.name}"</strong>?
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cancelApprove}
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
                onClick={confirmApprove}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#16a34a';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#22c55e';
                }}
              >
                Approve
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

export default Document;
