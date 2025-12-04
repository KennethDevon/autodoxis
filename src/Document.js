import React, { useState, useEffect } from 'react';
import QRCodeDisplay from './components/QRCodeDisplay';
import BarcodeDisplay from './components/BarcodeDisplay';
import AdvancedSearch from './components/AdvancedSearch';
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
  const [showTrackingTimeline, setShowTrackingTimeline] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDocument, setReviewDocument] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    comments: '',
    reviewer: ''
  });
  const [employees, setEmployees] = useState([]);
  const [offices, setOffices] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedOfficeForForm, setSelectedOfficeForForm] = useState('');
  const [filteredEmployeesForForm, setFilteredEmployeesForForm] = useState([]);
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

      if (editingDocument) {
        // Update existing document - use JSON for updates (file updates can be handled separately if needed)
        const documentData = {
          documentId: editingDocument.documentId,
          name: formData.attachment ? formData.attachment.name : editingDocument.name,
          type: formData.type || 'Report',
          description: formData.notes || '',
          submittedBy: formData.sender || 'Admin',
          status: selectedEmployeeObj ? 'Under Review' : editingDocument.status,
          dateUploaded: dateTimeString,
          reviewer: '',
          reviewDate: null,
          comments: '',
          filePath: formData.attachment ? formData.attachment.name : editingDocument.filePath,
          nextOffice: selectedEmployeeObj ? selectedEmployeeObj.position : editingDocument.nextOffice,
          currentOffice: selectedEmployeeObj ? selectedEmployeeObj.position : editingDocument.currentOffice,
          assignedTo: selectedEmployeeObj ? [selectedEmployeeObj._id] : editingDocument.assignedTo || [],
          currentHandler: selectedEmployeeObj ? selectedEmployeeObj._id : editingDocument.currentHandler,
          forwardedBy: formData.sender || 'Admin',
          forwardedDate: selectedEmployeeObj ? new Date().toISOString() : editingDocument.forwardedDate
        };
        
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
        // Add new document - use FormData for file upload
        const formDataToSend = new FormData();
        
        // Add file if attachment exists
        if (formData.attachment) {
          formDataToSend.append('attachment', formData.attachment);
        }
        
        // Add all document fields
        formDataToSend.append('documentId', generateDocumentId());
        formDataToSend.append('name', formData.attachment ? formData.attachment.name : `Document_${new Date().toISOString().split('T')[0]}`);
        formDataToSend.append('type', formData.type || 'Report');
        formDataToSend.append('description', formData.notes || '');
        formDataToSend.append('submittedBy', formData.sender || 'Admin');
        formDataToSend.append('status', selectedEmployeeObj ? 'Under Review' : 'Submitted');
        formDataToSend.append('dateUploaded', dateTimeString);
        formDataToSend.append('reviewer', '');
        formDataToSend.append('comments', '');
        formDataToSend.append('nextOffice', selectedEmployeeObj ? selectedEmployeeObj.position : '');
        formDataToSend.append('category', '');
        
        if (selectedEmployeeObj) {
          formDataToSend.append('assignedTo', JSON.stringify([selectedEmployeeObj._id]));
          formDataToSend.append('currentHandler', selectedEmployeeObj._id);
        } else {
          formDataToSend.append('assignedTo', JSON.stringify([]));
          formDataToSend.append('currentHandler', '');
        }
        
        formDataToSend.append('forwardedBy', formData.sender || 'Admin');
        if (selectedEmployeeObj) {
          formDataToSend.append('forwardedDate', new Date().toISOString());
        }
        
        const response = await fetch(`${API_URL}/documents`, {
          method: 'POST',
          body: formDataToSend,
        });
        
        if (response.ok) {
          showNotification('success', 'Document Added', 'Document added successfully!');
          fetchDocuments();
        } else {
          const errorData = await response.json();
          showNotification('error', 'Add Failed', errorData.message || 'Failed to add document');
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

  const handleReviewInputChange = (field, value) => {
    setReviewForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApproveFromReview = async () => {
    if (!reviewDocument) return;

    try {
      const userData = localStorage.getItem('userData');
      const approverName = userData ? JSON.parse(userData).username || 'Admin' : 'Admin';

      const updateData = {
        status: 'Approved',
        reviewer: reviewForm.reviewer || approverName,
        reviewDate: new Date().toISOString(),
        comments: reviewForm.comments || `Approved by Admin (${approverName})`,
        nextOffice: '', // Clear next office - workflow complete
      };

      const response = await fetch(`${API_URL}/documents/${reviewDocument._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        // Add routing history entry
        try {
          await fetch(`${API_URL}/documents/${reviewDocument._id}/routing-history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              office: reviewDocument.currentOffice || 'Admin',
              action: 'approved',
              handler: reviewForm.reviewer || approverName,
              comments: reviewForm.comments || `Final approval by Admin (${approverName})`
            }),
          });
        } catch (historyError) {
          console.error('Error adding routing history:', historyError);
        }

        setShowNotificationPane(true);
        setNotificationMessage(`Document "${reviewDocument.name}" has been approved successfully!`);
        setNotificationType('success');
        setShowReviewModal(false);
        setReviewDocument(null);
        fetchDocuments();
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
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setReviewDocument(null);
    setReviewForm({
      comments: '',
      reviewer: ''
    });
    fetchDocuments();
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
      
      {/* Document Table */}
      <div style={{ marginTop: '20px', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Document ID
                </th>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Name
                </th>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Type
                </th>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Submitted By
                </th>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Date
                </th>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Status
                </th>
                    <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Reviewer
                </th>
                <th style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedDocuments.length > 0 ? (
                filteredAndSortedDocuments.map((document) => (
                  <tr key={document._id} style={{ backgroundColor: 'white' }}>
                    <td style={{ border: '1px solid #e0e0e0', padding: '12px', fontSize: '13px', color: '#2c3e50' }}>
                      <code style={{
                        backgroundColor: '#f8f9fa',
                        padding: '2px 5px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#6c757d'
                      }}>
                        {document.documentId}
                      </code>
                    </td>
                    <td style={{ border: '1px solid #e0e0e0', padding: '12px', fontSize: '13px', fontWeight: '500', color: '#2c3e50' }}>
                      {document.name}
                    </td>
                    <td style={{ border: '1px solid #e0e0e0', padding: '12px', fontSize: '13px', color: '#2c3e50' }}>
                      <span style={{
                        backgroundColor: '#e8f5e8',
                        color: '#388e3c',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {document.type || 'N/A'}
                      </span>
                    </td>
                    <td style={{ border: '1px solid #e0e0e0', padding: '12px', fontSize: '13px', color: '#2c3e50' }}>
                      {document.submittedBy || 'N/A'}
                    </td>
                    <td style={{ border: '1px solid #e0e0e0', padding: '12px', fontSize: '12px', color: '#7f8c8d', whiteSpace: 'nowrap' }}>
                      {document.dateUploaded ? new Date(document.dateUploaded).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      }) : 'N/A'}
                    </td>
                    <td style={{ border: '1px solid #e0e0e0', padding: '12px', fontSize: '13px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
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
                    </td>
                    <td style={{ border: '1px solid #e0e0e0', padding: '12px', fontSize: '13px', color: '#7f8c8d' }}>
                      {document.reviewer || '-'}
                    </td>
                    <td style={{ border: '1px solid #e0e0e0', padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setViewingDocument(document)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '500',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(document)}
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
                          onClick={() => handleRemove(document._id)}
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
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ border: '1px solid #e0e0e0', padding: '40px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                    No documents found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

      {/* Document Route Tracking Modal */}
      {showTracker && showTracker.document && (
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
            padding: '20px',
            maxWidth: '900px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowTracker(null)}
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
              marginBottom: '15px',
              paddingBottom: '12px',
              borderBottom: '2px solid #ecf0f1'
            }}>
              <h2 style={{
                margin: '0 0 3px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                Document Tracking
              </h2>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: '#7f8c8d'
              }}>
                Track the route of your document
              </p>
            </div>

            {/* Document Info */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '6px'
              }}>
                <code style={{
                  backgroundColor: '#e9ecef',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#495057',
                  marginRight: '8px'
                }}>
                  {showTracker.document.documentId || showTracker.id}
                </code>
                <h3 style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  {showTracker.document.name || showTracker.name}
                </h3>
              </div>
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <span style={{
                  backgroundColor: showTracker.document.status === 'Approved' ? '#28a745' :
                                   showTracker.document.status === 'Rejected' ? '#dc3545' :
                                   showTracker.document.status === 'Processing' ? '#007bff' :
                                   showTracker.document.status === 'Under Review' ? '#ffc107' : '#6c757d',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  {showTracker.document.status || 'Submitted'}
                </span>
                <span style={{
                  color: '#6c757d',
                  fontSize: '11px'
                }}>
                  Submitted: {showTracker.document.dateUploaded ? new Date(showTracker.document.dateUploaded).toLocaleDateString() : 'N/A'}
                </span>
                <span style={{
                  color: '#6c757d',
                  fontSize: '11px'
                }}>
                  By: {showTracker.document.submittedBy || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Document Route */}
            <div style={{
              backgroundColor: '#ffffff',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{
                margin: '0 0 15px 0',
                fontSize: '15px',
                fontWeight: '600',
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '16px' }}>📍</span>
                Document Route
              </h4>
              
              {showTracker.document.routingHistory && showTracker.document.routingHistory.length > 0 ? (
                <div style={{ position: 'relative' }}>
                  {showTracker.document.routingHistory.map((entry, index) => {
                    const isLast = index === showTracker.document.routingHistory.length - 1;
                    const entryDate = entry.timestamp ? new Date(entry.timestamp) : (entry.date ? new Date(entry.date) : null);
                    const formattedDate = entryDate ? entryDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    }) : 'N/A';
                    const formattedTime = entryDate ? entryDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }) : 'N/A';
                    const handler = entry.handler || entry.performedBy || 'Unknown';
                    const office = entry.office || entry.toOffice || showTracker.document.currentOffice || 'Unknown Office';
                    const action = entry.action || 'processed';
                    
                    // Determine if this is the current location
                    const isCurrentLocation = index === showTracker.document.routingHistory.length - 1 && 
                      showTracker.document.status !== 'Completed' && 
                      showTracker.document.status !== 'Archived';
                    
                    return (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        marginBottom: isLast ? '0' : '12px',
                        position: 'relative'
                      }}>
                        {/* Route Line */}
                        {!isLast && (
                          <div style={{
                            position: 'absolute',
                            left: '13px',
                            top: '28px',
                            width: '2px',
                            height: 'calc(100% + 8px)',
                            backgroundColor: '#28a745',
                            zIndex: 1
                          }} />
                        )}
                        
                        {/* Route Point Icon */}
                        <div style={{
                          width: '26px',
                          height: '26px',
                          minWidth: '26px',
                          borderRadius: '50%',
                          backgroundColor: isCurrentLocation ? '#007bff' : '#28a745',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          marginRight: '12px',
                          zIndex: 2,
                          position: 'relative',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          {index + 1}
                        </div>
                        
                        {/* Route Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '15px',
                            marginBottom: '6px'
                          }}>
                            <div style={{ flex: 1 }}>
                              <h5 style={{
                                margin: '0 0 4px 0',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#2c3e50'
                              }}>
                                {office}
                                {isCurrentLocation && (
                                  <span style={{
                                    marginLeft: '8px',
                                    fontSize: '11px',
                                    color: '#007bff',
                                    fontWeight: '500'
                                  }}>
                                    (Current)
                                  </span>
                                )}
                              </h5>
                              <p style={{
                                margin: 0,
                                fontSize: '12px',
                                color: '#6c757d',
                                lineHeight: '1.3',
                                textTransform: 'capitalize'
                              }}>
                                {action.replace(/_/g, ' ')}
                              </p>
                            </div>
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: '10px',
                            flexWrap: 'wrap',
                            marginTop: '6px',
                            padding: '8px 10px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px',
                            border: '1px solid #e9ecef'
                          }}>
                            <span style={{
                              fontSize: '11px',
                              color: '#2c3e50',
                              fontWeight: '500'
                            }}>
                              📅 {formattedDate}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              color: '#2c3e50',
                              fontWeight: '500'
                            }}>
                              🕒 {formattedTime}
                            </span>
                            {handler && handler !== 'Unknown' && (
                              <span style={{
                                fontSize: '11px',
                                color: '#2c3e50',
                                fontWeight: '500'
                              }}>
                                👤 {handler}
                              </span>
                            )}
                            {entry.processingTime && (
                              <span style={{
                                fontSize: '11px',
                                color: '#2c3e50',
                                fontWeight: '500'
                              }}>
                                ⏱️ {entry.processingTime.toFixed(1)} hrs
                              </span>
                            )}
                          </div>
                          {entry.comments && (
                            <div style={{
                              marginTop: '6px',
                              padding: '6px 10px',
                              backgroundColor: '#e3f2fd',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: '#1565c0',
                              fontStyle: 'italic'
                            }}>
                              💬 {entry.comments}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: '#6c757d',
                  fontSize: '13px'
                }}>
                  No routing history available. Document route will appear here as it moves through the system.
                </div>
              )}
              
              {/* Show current office if different from last routing history entry */}
              {showTracker.document.currentOffice && 
               showTracker.document.routingHistory && 
               showTracker.document.routingHistory.length > 0 &&
               showTracker.document.routingHistory[showTracker.document.routingHistory.length - 1].office !== showTracker.document.currentOffice && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '6px',
                  border: '1px solid #ffc107',
                  fontSize: '12px',
                  color: '#856404'
                }}>
                  <strong>Current Location:</strong> {showTracker.document.currentOffice}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '15px',
              paddingTop: '12px',
              borderTop: '2px solid #ecf0f1'
            }}>
              <button
                onClick={() => setShowTracker(null)}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Review Modal */}
      {showReviewModal && reviewDocument && (
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
            borderRadius: '10px',
            padding: '15px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '88vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            boxShadow: '0 15px 50px rgba(0, 0, 0, 0.3)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={handleCloseReviewModal}
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
              marginBottom: '12px',
              paddingBottom: '10px',
              borderBottom: '2px solid #ecf0f1'
            }}>
              <h2 style={{
                margin: '0',
                fontSize: '18px',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                Document Review
              </h2>
          </div>

            {/* Workflow Progress Bar */}
            {(() => {
              // Define workflow stages based on document type
              const getWorkflowStages = () => {
                const docType = reviewDocument.type?.toUpperCase() || '';
                const category = reviewDocument.category || '';
                
                // For Endorsement Form
                if (
                  docType.includes('ENDORSEMENT FORM') ||
                  category === 'Endorsement Form'
                ) {
                  return ['Communication', 'Program Head', 'Vice President', 'Office of the President'];
                }

                // For Requested Subject - routes to VP
                if (
                  docType.includes('REQUESTED SUBJECT') || 
                  category === 'Requested Subject'
                ) {
                  return ['Program Head', 'Dean', 'Vice President'];
                }

                // For Faculty Loading and Travel Order - routes to Academic VP
                if (
                  docType.includes('FACULTY LOADING') || 
                  docType.includes('TRAVEL ORDER') ||
                  category === 'Faculty Loading' || 
                  category === 'Travel Order'
                ) {
                  return ['Program Head', 'Dean', 'Academic Vice President'];
                }
                
                // Default workflow
                return ['Program Head', 'Dean', 'Academic Vice President'];
              };

              // Check if workflow is complete
              const isDocumentWorkflowComplete = (doc) => {
                if (!doc.routingHistory || doc.routingHistory.length === 0) return false;
                
                const stages = getWorkflowStages();
                const finalStage = stages[stages.length - 1];
                
                // Check if document has been approved at the final stage
                const finalApproval = doc.routingHistory.find(entry => 
                  (entry.action === 'approved' || entry.action === 'Approved and Forwarded') &&
                  (entry.office === finalStage || 
                   entry.toOffice === finalStage ||
                   entry.office?.includes(finalStage) ||
                   entry.toOffice?.includes(finalStage))
                );
                
                return finalApproval !== undefined || doc.status === 'Approved' || doc.status === 'Completed';
              };

              const stages = getWorkflowStages();
              const currentOffice = reviewDocument.currentOffice || reviewDocument.nextOffice || 'Program Head';
              
              const isWorkflowComplete = isDocumentWorkflowComplete(reviewDocument);

              // Find current stage index
              let currentStageIndex = stages.indexOf(currentOffice);
              if (currentStageIndex === -1) {
                // Try to match partial strings
                currentStageIndex = stages.findIndex(stage => 
                  currentOffice.includes(stage) || stage.includes(currentOffice)
                );
              }
              if (currentStageIndex === -1) currentStageIndex = 0;
              if (isWorkflowComplete) {
                currentStageIndex = stages.length - 1;
              }

              return (
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#495057',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}>
                    Progress
                  </h4>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}>
                    {stages.map((stage, index) => {
                      const isCompleted = index < currentStageIndex || (isWorkflowComplete && index === currentStageIndex);
                      const isCurrent = !isWorkflowComplete && index === currentStageIndex;
                      
                      return (
                        <React.Fragment key={stage}>
                          {/* Stage Node */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            flex: 1,
                            position: 'relative',
                            zIndex: 2
                          }}>
                            {/* Circle */}
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: isCompleted ? '#27ae60' : isCurrent ? '#3498db' : '#e9ecef',
                              border: `2px solid ${isCompleted ? '#27ae60' : isCurrent ? '#3498db' : '#dee2e6'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              color: isCompleted || isCurrent ? 'white' : '#adb5bd',
                              fontSize: '12px',
                              marginBottom: '5px',
                              transition: 'all 0.3s ease',
                              boxShadow: isCurrent ? '0 0 10px rgba(52, 152, 219, 0.3)' : 'none'
                            }}>
                              {isCompleted ? '✓' : isCurrent ? '●' : (index + 1)}
                            </div>
                            
                            {/* Stage Label */}
                            <div style={{
                              fontSize: '9px',
                              fontWeight: isCurrent ? '700' : '600',
                              color: isCompleted ? '#27ae60' : isCurrent ? '#3498db' : '#adb5bd',
                              textAlign: 'center',
                              maxWidth: '80px',
                              lineHeight: '1.1',
                              textTransform: 'uppercase',
                              letterSpacing: '0.1px'
                            }}>
                              {stage}
                            </div>
                            
                            {/* Status Badge */}
                            {isCurrent && (
                              <div style={{
                                marginTop: '2px',
                                backgroundColor: '#3498db',
                                color: 'white',
                                fontSize: '7px',
                                padding: '1px 4px',
                                borderRadius: '4px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.2px'
                              }}>
                                Now
        </div>
      )}
                            {isCompleted && (
                              <div style={{
                                marginTop: '2px',
                                backgroundColor: '#27ae60',
                                color: 'white',
                                fontSize: '7px',
                                padding: '1px 4px',
                                borderRadius: '4px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.2px'
                              }}>
                                Approved
                              </div>
                            )}
                          </div>
                          
                          {/* Connector Line */}
                          {index < stages.length - 1 && (
                            <div style={{
                              flex: 1,
                              height: '2px',
                              backgroundColor: index < currentStageIndex ? '#27ae60' : '#e9ecef',
                              margin: '0 -6px',
                              marginBottom: '24px',
                              position: 'relative',
                              zIndex: 1,
                              transition: 'all 0.3s ease'
                            }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  
                  {/* Current Location Info */}
                  <div style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    textAlign: 'center',
                    border: '1px solid #dee2e6'
                  }}>
                    <span style={{
                      fontSize: '9px',
                      color: '#6c757d',
                      fontWeight: '500'
                    }}>
                      📍 
                    </span>
                    <span style={{
                      fontSize: '9px',
                      color: '#3498db',
                      fontWeight: '700',
                      marginLeft: '3px'
                    }}>
                      {currentOffice}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Document Info */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '10px 12px',
              borderRadius: '6px',
              marginBottom: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '6px'
              }}>
                <code style={{
                  backgroundColor: '#e9ecef',
                  padding: '2px 5px',
                  borderRadius: '3px',
                  fontSize: '9px',
                  fontWeight: '600',
                  color: '#495057',
                  marginRight: '6px'
                }}>
                  {reviewDocument.documentId}
                </code>
                <h3 style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  {reviewDocument.name}
                </h3>
              </div>
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <span style={{
                  backgroundColor: reviewDocument.status === 'Approved' ? '#28a745' :
                                   reviewDocument.status === 'Rejected' ? '#dc3545' :
                                   reviewDocument.status === 'Processing' ? '#007bff' :
                                   reviewDocument.status === 'Under Review' ? '#ffc107' : '#6c757d',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  {reviewDocument.status || 'Submitted'}
                </span>
                <span style={{
                  color: '#6c757d',
                  fontSize: '10px'
                }}>
                  Submitted by: {reviewDocument.submittedBy || 'Unknown'}
                </span>
                <span style={{
                  color: '#6c757d',
                  fontSize: '10px'
                }}>
                  Date: {reviewDocument.dateUploaded ? new Date(reviewDocument.dateUploaded).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Review Form */}
            <div style={{ display: 'grid', gap: '10px' }}>
              {/* Reviewer */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Reviewer *
                </label>
                <input
                  type="text"
                  value={reviewForm.reviewer}
                  onChange={(e) => handleReviewInputChange('reviewer', e.target.value)}
                  placeholder="Enter reviewer name"
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '5px',
                    fontSize: '12px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
                />
              </div>

              {/* Comments */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Review Comments
                </label>
                <textarea
                  value={reviewForm.comments}
                  onChange={(e) => handleReviewInputChange('comments', e.target.value)}
                  placeholder="Enter review comments or feedback..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '5px',
                    fontSize: '12px',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
                />
              </div>
            </div>

            {/* Routing History */}
            {reviewDocument?.routingHistory && reviewDocument.routingHistory.length > 0 && (
              <div style={{
                marginTop: '15px',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{
                  margin: '0 0 10px 0',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Routing History
                </h3>
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {reviewDocument.routingHistory.map((entry, index) => (
                    <div key={index} style={{
                      padding: '8px 10px',
                      marginBottom: '6px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      borderLeft: '3px solid #3498db',
                      fontSize: '11px'
                    }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#2c3e50',
                        marginBottom: '3px'
                      }}>
                        {entry.action ? entry.action.charAt(0).toUpperCase() + entry.action.slice(1).replace(/_/g, ' ') : 'Updated'}
                        {entry.office && (
                          <span style={{ color: '#7f8c8d', fontWeight: 'normal' }}>
                            {' '}at {entry.office}
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#7f8c8d', fontSize: '10px' }}>
                        {(() => {
                          const handler = entry.handler || entry.performedBy || 'Unknown';
                          const timestamp = entry.timestamp || entry.date;
                          const dateStr = timestamp 
                            ? new Date(timestamp).toLocaleString('en-US', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })
                            : 'N/A';
                          return `By: ${handler} • ${dateStr}`;
                        })()}
                      </div>
                      {entry.comments && (
                        <div style={{ 
                          marginTop: '4px', 
                          color: '#495057',
                          fontStyle: 'italic'
                        }}>
                          "{entry.comments}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              marginTop: '15px',
              paddingTop: '12px',
              borderTop: '2px solid #ecf0f1',
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCloseReviewModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#7f8c8d'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#95a5a6'}
              >
                Close
              </button>
              {reviewDocument.status !== 'Approved' && reviewDocument.status !== 'Completed' && (
                <button
                  onClick={handleApproveFromReview}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#229954'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#27ae60'}
                >
                  ✓ Approve
                </button>
              )}
            </div>
          </div>
        </div>
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

              {/* File Attachment */}
              {viewingDocument.filePath && (
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
                    Attached File
                  </label>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#2c3e50',
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>
                        {viewingDocument.filePath.split('/').pop() || viewingDocument.filePath}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6c757d'
                      }}>
                        Click to view or download
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={`${API_URL}${viewingDocument.filePath.startsWith('/') ? '' : '/'}${viewingDocument.filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          display: 'inline-block'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                      >
                        View File
                      </a>
                      <a
                        href={`${API_URL}/documents/${viewingDocument._id}/download`}
                        download
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          display: 'inline-block'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                      >
                        Download
                      </a>
                    </div>
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
                  setReviewDocument(viewingDocument);
                  setReviewForm({
                    comments: viewingDocument.comments || '',
                    reviewer: viewingDocument.reviewer || ''
                  });
                  setShowReviewModal(true);
                  setViewingDocument(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
              >
                Review
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
