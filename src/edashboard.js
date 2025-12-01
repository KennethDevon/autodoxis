import React, { useState, useEffect } from 'react';
import NotificationSystem, { showNotification } from './components/NotificationSystem';
import API_URL from './config';

function Edashboard({ onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]); // For History Logs - shows ALL documents
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    position: '',
    department: ''
  });
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    sender: '',
    type: '',
    date: '',
    time: '',
    notes: '',
    attachment: null,
    receiver: ''
  });
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    incoming: 0,
    outgoing: 0,
    active: 0,
    pending: 0,
    completed: 0
  });
  
  // New state for enhanced document management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [submitterFilter, setSubmitterFilter] = useState('All');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackedDocument, setTrackedDocument] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    status: '',
    comments: '',
    reviewer: '',
    nextOffice: ''
  });
  const [activeSidebarTab, setActiveSidebarTab] = useState('dashboard');
  const [documentTypes, setDocumentTypes] = useState([]);
  const [offices, setOffices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteDocumentModal, setShowDeleteDocumentModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [showNotificationPane, setShowNotificationPane] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info'); // 'success', 'error', or 'info'

  useEffect(() => {
    fetchUserData();
    fetchDocuments();
    fetchDocumentTypes();
    fetchOffices();
  }, []);

  // Refresh documents when History Logs tab is opened to ensure status is up-to-date
  useEffect(() => {
    if (activeSidebarTab === 'history') {
      fetchDocuments();
    }
  }, [activeSidebarTab]);

  const fetchUserData = async () => {
    try {
      // Get user data from localStorage (stored during login)
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // If user has employeeId, fetch employee details
        if (parsedUser.employeeId) {
          // Fetch all employees and find the one matching the employeeId
          const response = await fetch(`${API_URL}/employees`);
          if (response.ok) {
            const allEmployees = await response.json();
            const employeeData = allEmployees.find(emp => emp.employeeId === parsedUser.employeeId);
            if (employeeData) {
            setEmployee(employeeData);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // Get user data to check if they have an employee ID
      const userData = localStorage.getItem('userData');
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('Current user:', parsedUser);
        
        // If user has employeeId, first get their employee record
        if (parsedUser.employeeId && !parsedUser.role?.includes('Admin')) {
          try {
            // Get employee data by employeeId
            const employeesResponse = await fetch(`${API_URL}/employees`);
            const allEmployees = await employeesResponse.json();
            const currentEmployee = allEmployees.find(emp => emp.employeeId === parsedUser.employeeId);
            
            console.log('Current employee found:', currentEmployee);
            console.log('Employee position:', currentEmployee?.position);
            
            if (currentEmployee) {
              // Fetch ALL documents
              const response = await fetch(`${API_URL}/documents`);
              let fetchedDocuments = await response.json();
              console.log('Total documents fetched:', fetchedDocuments.length);
              
              // Filter documents based on employee position
              const position = currentEmployee.position;
              let filteredDocuments = [];
              
              if (position === 'Communication' || position === 'Communications' || position === 'Secretary') {
                filteredDocuments = fetchedDocuments.filter(doc => 
                  doc.nextOffice === 'Communication' || doc.currentOffice === 'Communication' ||
                  doc.nextOffice === 'Secretary' || doc.currentOffice === 'Secretary'
                );
                console.log('Filtered for Communication/Secretary:', filteredDocuments.length);
              } else if (position === 'Program Head') {
                // Show documents routed to Program Head
                filteredDocuments = fetchedDocuments.filter(doc => {
                  // Check if routed to Program Head
                  const routedToPH = doc.nextOffice === 'Program Head' || doc.currentOffice === 'Program Head';
                  
                  // Check if it's Faculty Loading, Requested Subject, or Travel Order by category OR type
                  const isFacultyLoadingDoc = 
                    doc.category === 'Faculty Loading' || 
                    doc.category === 'Requested Subject' ||
                    doc.category === 'Travel Order' ||
                    doc.category === 'Endorsement Form' ||
                    doc.type === 'FACULTY LOADING' ||
                    doc.type === 'Faculty Loading' ||
                    doc.type === 'Requested Subject' ||
                    doc.type === 'Travel Order' ||
                    doc.type === 'Endorsement Form' ||
                    doc.type?.toLowerCase().includes('faculty loading') ||
                    doc.type?.toLowerCase().includes('requested subject') ||
                    doc.type?.toLowerCase().includes('travel order') ||
                    doc.type?.toLowerCase().includes('endorsement form');
                  
                  // Show if routed to PH OR if it's a Faculty Loading type document that's Under Review/Submitted
                  const shouldShow = routedToPH || 
                    (isFacultyLoadingDoc && 
                     (doc.status === 'Under Review' || doc.status === 'Submitted'));
                  
                  if (shouldShow) {
                    console.log('✓ Program Head will see:', doc.name, '- Type:', doc.type, '- Status:', doc.status);
                  }
                  
                  return shouldShow;
                });
                console.log('Filtered for Program Head:', filteredDocuments.length);
              } else if (position === 'Dean') {
                // Show documents routed to Dean OR forwarded from Program Head
                filteredDocuments = fetchedDocuments.filter(doc => {
                  const routedToDean = doc.nextOffice === 'Dean' || doc.currentOffice === 'Dean';
                  const fromProgramHead = doc.reviewer && doc.status !== 'Submitted';
                  
                  if (routedToDean) {
                    console.log('✓ Dean will see:', doc.name);
                  }
                  return routedToDean;
                });
                console.log('Filtered for Dean:', filteredDocuments.length);
              } else if (position === 'Academic VP' || position === 'Academic Vice President') {
                // Show documents routed to Academic Vice President
                filteredDocuments = fetchedDocuments.filter(doc => 
                  doc.nextOffice === 'Academic Vice President' || 
                  doc.nextOffice === 'Academic VP' ||
                  doc.currentOffice === 'Academic Vice President' ||
                  doc.currentOffice === 'Academic VP'
                );
                console.log('Filtered for Academic VP:', filteredDocuments.length);
              } else if (position === 'Vice President' || position === 'VP') {
                // Show documents routed to Vice President
                filteredDocuments = fetchedDocuments.filter(doc => 
                  doc.nextOffice === 'Vice President' || 
                  doc.nextOffice === 'VP' ||
                  doc.currentOffice === 'Vice President' ||
                  doc.currentOffice === 'VP'
                );
                console.log('Filtered for Vice President:', filteredDocuments.length);
              } else if (position === 'OP' || position === 'Office of the President' || position === 'President') {
                // Show documents routed to Office of the President
                filteredDocuments = fetchedDocuments.filter(doc => 
                  doc.nextOffice === 'Office of the President' || 
                  doc.nextOffice === 'OP' ||
                  doc.nextOffice === 'President' ||
                  doc.currentOffice === 'Office of the President' ||
                  doc.currentOffice === 'OP' ||
                  doc.currentOffice === 'President'
                );
                console.log('Filtered for Office of the President:', filteredDocuments.length);
              } else if (position === 'Faculty' || position === 'Staff') {
                // Faculty/Staff see documents they submitted or assigned to them
                filteredDocuments = fetchedDocuments.filter(doc => 
                  doc.submittedBy === parsedUser.username ||
                  doc.assignedTo?.includes(currentEmployee._id) ||
                  doc.currentHandler === currentEmployee._id
                );
                console.log('Filtered for Faculty/Staff:', filteredDocuments.length);
              } else {
                // Default: show documents assigned to this employee
                filteredDocuments = fetchedDocuments.filter(doc => 
                  doc.assignedTo?.includes(currentEmployee._id) ||
                  doc.currentHandler === currentEmployee._id
                );
                console.log('Filtered for other position:', filteredDocuments.length);
              }
              
              setDocuments(filteredDocuments);
              setAllDocuments(fetchedDocuments); // Store ALL documents for History Logs
              calculateSummaryStats(filteredDocuments);
              setLoading(false);
              // System notification only on initial load
              if (documents.length === 0 && filteredDocuments.length > 0) {
                showNotification('info', 'System Ready', `Welcome! ${filteredDocuments.length} document(s) ready for review`);
              }
              return;
            }
          } catch (empError) {
            console.error('Error fetching employee data:', empError);
          }
        }
      }
      
      // Fallback: fetch all documents if no employee found
      const response = await fetch(`${API_URL}/documents`);
      const data = await response.json();
      console.log('Documents fetched (fallback):', data.length);
      setDocuments(data);
      setAllDocuments(data); // Also update allDocuments for History Logs
      calculateSummaryStats(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/document-types`);
      const data = await response.json();
      console.log('Fetched document types:', data);
      // Use the actual document types from the database
      setDocumentTypes(data);
    } catch (error) {
      console.error('Error fetching document types:', error);
      // Fallback to default types if API fails
      setDocumentTypes(['Report', 'Memo', 'Letter', 'Contract', 'Invoice', 'Certificate', 'Other']);
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

  const fetchEmployees = async (officeName) => {
    try {
      const response = await fetch(`${API_URL}/employees`);
      const data = await response.json();
      // Filter employees by office/department
      const filteredEmployees = data.filter(emp => emp.department === officeName);
      setEmployees(filteredEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const calculateSummaryStats = (docs) => {
    const stats = {
      total: docs.length,
      incoming: 0,
      outgoing: 0,
      active: 0,
      pending: 0,
      completed: 0
    };

    // Get current user data
    const userData = localStorage.getItem('userData');
    const currentUser = userData ? JSON.parse(userData) : null;

    docs.forEach(doc => {
      // Count incoming vs outgoing based on submittedBy
      if (doc.submittedBy && currentUser && doc.submittedBy.toLowerCase() === currentUser.username.toLowerCase()) {
        stats.outgoing++;
      } else {
        stats.incoming++;
      }

      // Count by status
      if (doc.status) {
        const status = doc.status.toLowerCase();
        if (status === 'submitted' || status === 'under review' || status === 'processing') {
          stats.active++;
        } else if (status === 'pending') {
          stats.pending++;
        } else if (status === 'approved' || status === 'completed') {
          stats.completed++;
        }
      } else {
        // Default to active if no status
        stats.active++;
      }
    });

    setSummaryStats(stats);
  };

  // New functions for enhanced document management
  const handleDocumentClick = (document) => {
    setSelectedDocument(document);
    setReviewForm({
      status: document.status || '',
      comments: document.comments || '',
      reviewer: user?.username || employee?.name || '',
      nextOffice: document.nextOffice || ''
    });
    setShowReviewModal(true);
  };

  const handleTrackDocument = (document) => {
    setTrackedDocument(document);
    setShowTrackModal(true);
  };

  const handleCloseTrackModal = () => {
    setShowTrackModal(false);
    setTrackedDocument(null);
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setSelectedDocument(null);
    setReviewForm({
      status: '',
      comments: '',
      reviewer: '',
      nextOffice: ''
    });
    // Refresh documents when closing review modal to ensure History Logs shows updated status
    setTimeout(() => {
      fetchDocuments();
    }, 500); // Small delay to ensure backend update is complete
  };

  const handleReviewInputChange = (field, value) => {
    setReviewForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper function to check if position matches office (handles variants like "Academic VP" vs "Academic Vice President")
  const positionMatchesOffice = (position, office) => {
    if (!position || !office) return false;
    
    // Exact match
    if (position === office) return true;
    
    // Handle Academic VP / Academic Vice President variants
    if ((position === 'Academic VP' || position === 'Academic Vice President') &&
        (office === 'Academic VP' || office === 'Academic Vice President')) {
      return true;
    }
    
    // Handle VP / Vice President variants
    if ((position === 'VP' || position === 'Vice President') &&
        (office === 'VP' || office === 'Vice President')) {
      return true;
    }

    // Secretary handles Communication stage
    if ((position?.toLowerCase() === 'secretary' && office?.toLowerCase().includes('communication')) ||
        (office?.toLowerCase() === 'secretary' && position?.toLowerCase().includes('communication'))) {
      return true;
    }

    // Handle Office of the President variants
    if ((position === 'Office of the President' || position === 'President' || position === 'OP') &&
        (office === 'Office of the President' || office === 'President' || office === 'OP')) {
      return true;
    }

    // Handle Communication office name variants
    if (position.toLowerCase().includes('communication') && office.toLowerCase().includes('communication')) {
      return true;
    }

    // Case-insensitive fallback comparison
    if (position.toLowerCase() === office.toLowerCase()) {
      return true;
    }
    
    return false;
  };

  const isEndorsementDocument = (doc) => {
    if (!doc) return false;
    const docType = doc.type?.toUpperCase() || '';
    const docCategory = doc.category?.toUpperCase() || '';
    return docType.includes('ENDORSEMENT') || docCategory.includes('ENDORSEMENT');
  };

  const isRequestedSubjectDocument = (doc) => {
    if (!doc) return false;
    const docType = doc.type?.toUpperCase() || '';
    const docCategory = doc.category?.toUpperCase() || '';
    return docType.includes('REQUESTED SUBJECT') || docCategory.includes('REQUESTED SUBJECT');
  };

  const isDocumentWorkflowComplete = (doc) => {
    return doc?.status === 'Approved' && (!doc?.nextOffice || doc?.nextOffice === '');
  };

  // Get next office based on current position
  const getNextOffice = () => {
    if (!employee) return null;
    
    const position = employee.position;
    const endorsementFlow = isEndorsementDocument(selectedDocument);
    const requestedSubjectFlow = isRequestedSubjectDocument(selectedDocument);
    
    if (position === 'Communication' || position === 'Communications' || position === 'Secretary') {
      return 'Program Head';
    } else if (position === 'Program Head') {
      // Endorsement Form goes to VP, others go to Dean
      return endorsementFlow ? 'Vice President' : 'Dean';
    } else if (position === 'Dean') {
      // Requested Subject goes to VP, others go to Academic VP
      return requestedSubjectFlow ? 'Vice President' : 'Academic Vice President';
    } else if (position === 'Academic VP' || position === 'Academic Vice President') {
      // Academic VP is final approver for Faculty Loading and Travel Order
      return null;
    } else if (position === 'Vice President' || position === 'VP') {
      // VP routes to OP for Endorsement Form, is final for Requested Subject
      return endorsementFlow ? 'Office of the President' : null;
    } else if (position === 'Office of the President' || position === 'President') {
      return null; // Final approver
    }
    
    return null;
  };

  // Quick action: Approve & Forward
  const handleApproveAndForward = async () => {
    if (!selectedDocument) return;

    const nextOffice = getNextOffice();
    if (!nextOffice) {
      alert('Cannot forward: No next office defined for your position');
      return;
    }

    try {
      const currentPosition = employee?.position || user?.username;
      const approverName = employee?.name || user?.username || 'Unknown';
      
      const updateData = {
        status: 'Approved',
        comments: reviewForm.comments || `Approved by ${approverName}`,
        reviewer: approverName,
        reviewDate: new Date().toISOString(),
        nextOffice: nextOffice,
        currentOffice: nextOffice,
        $push: {
          routingHistory: {
            fromOffice: currentPosition,
            toOffice: nextOffice,
            action: 'Approved and Forwarded',
            performedBy: approverName,
            date: new Date().toISOString(),
            comments: reviewForm.comments || `Approved by ${approverName}`
          }
        }
      };

      const response = await fetch(`${API_URL}/documents/${selectedDocument._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        showNotification('success', 'Document Approved & Forwarded', `Document approved and forwarded to ${nextOffice} successfully!`);
        handleCloseReviewModal();
        // Refresh documents immediately to update History Logs
        await fetchDocuments();
        // Force refresh if History Logs tab is open
        if (activeSidebarTab === 'history') {
          setTimeout(() => {
            fetchDocuments();
          }, 300);
        }
      } else {
        alert('Failed to approve and forward document');
      }
    } catch (error) {
      console.error('Error approving and forwarding:', error);
      alert('Error approving and forwarding document');
    }
  };

  // Quick action: Forward Only
  const handleForwardToNext = async () => {
    if (!selectedDocument) return;

    const nextOffice = getNextOffice();
    if (!nextOffice) {
      alert('Cannot forward: No next office defined for your position');
      return;
    }

    try {
      const updateData = {
        status: 'Processing',
        comments: reviewForm.comments || `Forwarded by ${employee?.name || user?.username}`,
        reviewer: employee?.name || user?.username || 'Unknown',
        reviewDate: new Date().toISOString(),
        nextOffice: nextOffice,
        currentOffice: nextOffice
      };

      const response = await fetch(`${API_URL}/documents/${selectedDocument._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        alert(`Document forwarded to ${nextOffice} successfully!`);
        handleCloseReviewModal();
        // Refresh documents immediately to update History Logs
        await fetchDocuments();
        // Force refresh if History Logs tab is open
        if (activeSidebarTab === 'history') {
          setTimeout(() => {
            fetchDocuments();
          }, 300);
        }
      } else {
        alert('Failed to forward document');
      }
    } catch (error) {
      console.error('Error forwarding:', error);
      alert('Error forwarding document');
    }
  };

  // Quick action: Reject & Return
  const handleRejectAndReturn = async () => {
    if (!selectedDocument) return;

    if (!reviewForm.comments) {
      alert('Please provide comments explaining why the document is being rejected');
      return;
    }

    try {
      const currentPosition = employee?.position || user?.username;
      const approverName = employee?.name || user?.username || 'Unknown';
      
      const updateData = {
        status: 'Rejected',
        comments: reviewForm.comments,
        reviewer: approverName,
        reviewDate: new Date().toISOString(),
        $push: {
          routingHistory: {
            fromOffice: currentPosition,
            toOffice: 'Returned to Submitter',
            action: 'Rejected',
            performedBy: approverName,
            date: new Date().toISOString(),
            comments: reviewForm.comments
          }
        }
      };

      const response = await fetch(`${API_URL}/documents/${selectedDocument._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        showNotification('warning', 'Document Rejected', 'Document has been rejected and returned to submitter.');
        handleCloseReviewModal();
        // Refresh documents immediately to update History Logs
        await fetchDocuments();
        // Force refresh if History Logs tab is open
        if (activeSidebarTab === 'history') {
          setTimeout(() => {
            fetchDocuments();
          }, 300);
        }
      } else {
        alert('Failed to reject document');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Error rejecting document');
    }
  };

  // Quick action: Final Approve (for Academic VP, VP, OP)
  const handleFinalApprove = async () => {
    if (!selectedDocument) return;

    try {
      const currentPosition = employee?.position || user?.username;
      const approverName = employee?.name || user?.username || 'Unknown';
      
      const updateData = {
        status: 'Approved',
        comments: reviewForm.comments || `Final approval by ${approverName}`,
        reviewer: approverName,
        reviewDate: new Date().toISOString(),
        nextOffice: '', // Clear next office - workflow complete
        currentOffice: currentPosition // Keep at final office
      };

      const response = await fetch(`${API_URL}/documents/${selectedDocument._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        // Add routing history entry for final approval
        try {
          await fetch(`${API_URL}/documents/${selectedDocument._id}/routing-history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              office: currentPosition,
              action: 'approved',
              handler: approverName,
              comments: reviewForm.comments || `Final approval by ${approverName}`
            }),
          });
        } catch (historyError) {
          console.error('Error adding routing history:', historyError);
          // Don't fail the approval if history fails
        }

        showNotification('success', 'Document Approved', `Document "${selectedDocument.name}" has received FINAL APPROVAL! Workflow complete.`);
        handleCloseReviewModal();
        // Refresh documents immediately to update History Logs
        await fetchDocuments();
        // Force refresh if History Logs tab is open
        if (activeSidebarTab === 'history') {
          setTimeout(() => {
            fetchDocuments();
          }, 300);
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to approve document: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Error approving document');
    }
  };

  const handleUpdateDocumentStatus = async () => {
    if (!selectedDocument) return;

    try {
      // Prepare update data
      const updateData = {
        status: reviewForm.status,
        comments: reviewForm.comments,
        reviewer: reviewForm.reviewer,
        reviewDate: new Date().toISOString()
      };

      // If forwarding to next office, set nextOffice and currentOffice
      if (reviewForm.nextOffice) {
        updateData.nextOffice = reviewForm.nextOffice;
        updateData.currentOffice = reviewForm.nextOffice;
        updateData.status = 'Processing'; // Update status when forwarding
      }

      const response = await fetch(`${API_URL}/documents/${selectedDocument._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const message = reviewForm.nextOffice 
          ? `Document forwarded to ${reviewForm.nextOffice} successfully!` 
          : 'Document status updated successfully!';
        showNotification('success', 'Status Updated', message);
        handleCloseReviewModal();
        // Refresh documents immediately to update History Logs
        await fetchDocuments();
        // Force refresh if History Logs tab is open
        if (activeSidebarTab === 'history') {
          setTimeout(() => {
            fetchDocuments();
          }, 300);
        }
      } else {
        alert('Failed to update document status');
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      alert('Error updating document status');
    }
  };

  const handleDeleteDocument = (documentId) => {
    const document = documents.find(doc => doc._id === documentId);
    setDocumentToDelete({ id: documentId, name: document?.name || 'this document' });
    setShowDeleteDocumentModal(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      const response = await fetch(`${API_URL}/documents/${documentToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowNotificationPane(true);
        setNotificationMessage('Document deleted successfully');
        setNotificationType('success');
        fetchDocuments(); // Refresh the documents list
        setTimeout(() => setShowNotificationPane(false), 3000);
      } else {
        setShowNotificationPane(true);
        setNotificationMessage('Failed to delete document');
        setNotificationType('error');
        setTimeout(() => setShowNotificationPane(false), 3000);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setShowNotificationPane(true);
      setNotificationMessage('Error deleting document');
      setNotificationType('error');
      setTimeout(() => setShowNotificationPane(false), 3000);
    }
    
    setShowDeleteDocumentModal(false);
    setDocumentToDelete(null);
  };

  const cancelDeleteDocument = () => {
    setShowNotificationPane(true);
    setNotificationMessage('Document deletion cancelled');
    setNotificationType('info');
    setTimeout(() => setShowNotificationPane(false), 3000);
    
    setShowDeleteDocumentModal(false);
    setDocumentToDelete(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted': return '#17a2b8';
      case 'Under Review': return '#ffc107';
      case 'Approved': return '#28a745';
      case 'Rejected': return '#dc3545';
      case 'Processing': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Submitted': return '';
      case 'Under Review': return '';
      case 'Approved': return '';
      case 'Rejected': return '';
      case 'Processing': return '';
      default: return '';
    }
  };

  const getTimelineSteps = (document) => {
    const steps = [
      {
        id: 'submitted',
        title: 'Document Submitted',
        description: 'Document has been submitted for review',
        date: document.dateUploaded ? new Date(document.dateUploaded).toLocaleDateString() : null,
        completed: true,
        active: document.status === 'Submitted'
      },
      {
        id: 'received',
        title: 'Document Received',
        description: 'Document received and acknowledged by reviewer',
        date: document.status !== 'Submitted' ? new Date(document.dateUploaded).toLocaleDateString() : null,
        completed: document.status !== 'Submitted',
        active: document.status === 'Under Review'
      },
      {
        id: 'review',
        title: 'Under Review',
        description: 'Document is being reviewed by assigned reviewer',
        date: document.status === 'Under Review' ? new Date().toLocaleDateString() : null,
        completed: document.status === 'Approved' || document.status === 'Rejected',
        active: document.status === 'Under Review'
      },
      {
        id: 'completed',
        title: 'Review Completed',
        description: document.status === 'Approved' ? 'Document approved and processed' : document.status === 'Rejected' ? 'Document rejected - requires resubmission' : 'Review process completed',
        date: document.reviewDate ? new Date(document.reviewDate).toLocaleDateString() : null,
        completed: document.status === 'Approved' || document.status === 'Rejected',
        active: false,
        isRejected: document.status === 'Rejected'
      }
    ];
    return steps;
  };

  // Get unique submitters for filter dropdown
  const getUniqueSubmitters = () => {
    const submitters = [...new Set(documents.map(doc => doc.submittedBy).filter(Boolean))];
    return submitters;
  };

  // Filter documents based on search and filters
  // Only show documents assigned to the employee
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.documentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.submittedBy?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
    const matchesSubmitter = submitterFilter === 'All' || doc.submittedBy === submitterFilter;
    
    return matchesSearch && matchesStatus && matchesSubmitter;
  });

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    // Clear user data from localStorage
    localStorage.removeItem('userData');
    onLogout();
  };

  const cancelLogout = () => {
    setShowNotificationPane(true);
    setNotificationMessage('Logout cancelled');
    setNotificationType('info');
    setTimeout(() => setShowNotificationPane(false), 3000);
    setShowLogoutModal(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditForm({
      username: user?.username || '',
      email: user?.email || '',
      password: '',
      confirmPassword: '',
      position: employee?.position || '',
      department: employee?.department || ''
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      position: '',
      department: ''
    });
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      // Validate password if provided
      if (editForm.password && editForm.password.trim() !== '') {
        if (editForm.password.length < 6) {
          alert('Password must be at least 6 characters long');
          return;
        }
        if (editForm.password !== editForm.confirmPassword) {
          alert('Passwords do not match');
          return;
        }
      }

      // Update user data
      const userUpdateData = {
        username: editForm.username,
        email: editForm.email
      };

      // Only include password if it's provided
      if (editForm.password && editForm.password.trim() !== '') {
        userUpdateData.password = editForm.password;
      }

      const userResponse = await fetch(`${API_URL}/auth/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userUpdateData),
      });

      if (userResponse.ok) {
        // Update employee data if employee exists
        if (employee) {
          const employeeUpdateData = {
            position: editForm.position,
            department: editForm.department
          };

          const employeeResponse = await fetch(`${API_URL}/employees/${employee._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(employeeUpdateData),
          });

          if (employeeResponse.ok) {
            const updatedEmployee = await employeeResponse.json();
            setEmployee(updatedEmployee);
          }
        }

        // Update local user data
        const updatedUser = { ...user, ...userUpdateData };
        setUser(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  const handleDocumentInputChange = (field, value) => {
    setDocumentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOfficeChange = (officeName) => {
    setSelectedOffice(officeName);
    setDocumentForm(prev => ({
      ...prev,
      receiver: '' // Clear receiver when office changes
    }));
    if (officeName) {
      fetchEmployees(officeName);
    } else {
      setEmployees([]);
    }
  };

  const handleEmployeeChange = (employeeName) => {
    setDocumentForm(prev => ({
      ...prev,
      receiver: employeeName
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setDocumentForm(prev => ({
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

      // Find the selected employee's _id
      const selectedEmployee = employees.find(emp => emp.name === documentForm.receiver);
      console.log('Selected employee:', selectedEmployee);
      console.log('Document form receiver:', documentForm.receiver);

      // Prepare document data matching backend schema
      const documentData = {
        documentId: generateDocumentId(),
        name: documentForm.attachment ? documentForm.attachment.name : `Document_${new Date().toISOString().split('T')[0]}`,
        type: documentForm.type || 'Report',
        description: documentForm.notes || '',
        submittedBy: user?.username || 'Unknown User',
        status: selectedEmployee ? 'Under Review' : 'Submitted',
        dateUploaded: new Date().toISOString(),
        reviewer: '',
        reviewDate: null,
        comments: '',
        filePath: documentForm.attachment ? documentForm.attachment.name : '',
        // Use selected employee's position as nextOffice for proper routing
        nextOffice: selectedEmployee ? selectedEmployee.position : '',
        currentOffice: selectedEmployee ? selectedEmployee.position : '',
        // Assign to employee if selected
        assignedTo: selectedEmployee ? [selectedEmployee._id] : [],
        currentHandler: selectedEmployee ? selectedEmployee._id : null,
        forwardedBy: user?.username || 'Unknown User',
        forwardedDate: selectedEmployee ? new Date().toISOString() : null
      };

      console.log('Submitting document with data:', documentData);

      const response = await fetch(`${API_URL}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
      });

      if (response.ok) {
        const createdDoc = await response.json();
        console.log('Document created:', createdDoc);
        
        // If document was assigned to an employee, add to routing history
        if (selectedEmployee) {
          showNotification('success', 'Document Added', `Document added and forwarded to ${selectedEmployee.name} successfully!`);
        } else {
          showNotification('success', 'Document Added', 'Document added successfully!');
        }
        
        setShowDocumentModal(false);
        setDocumentForm({
          sender: '',
          type: '',
          date: '',
          time: '',
          notes: '',
          attachment: null,
          receiver: ''
        });
        fetchDocuments(); // Refresh the documents list
      } else {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        alert(`Failed to add document: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding document:', error);
      alert('Error adding document. Please check your connection and try again.');
    }
  };

  const handleCloseDocumentModal = () => {
    setShowDocumentModal(false);
    setDocumentForm({
      sender: '',
      type: '',
      date: '',
      time: '',
      notes: '',
      attachment: null,
      receiver: ''
    });
  };

  const handleOpenDocumentModal = () => {
    setShowDocumentModal(true);
    // Auto-populate sender with employee name
    const senderName = employee ? employee.name : (user ? user.name : '');
    setDocumentForm(prev => ({
      ...prev,
      sender: senderName
    }));
    // Reset office and employee selections
    setSelectedOffice('');
    setEmployees([]);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
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
            Employee Portal
          </p>
        </div>


        {/* Navigation */}
        <nav style={{ flex: 1, padding: '20px 0' }}>
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '5px' }}>
              <button
                onClick={() => setActiveSidebarTab('dashboard')}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: activeSidebarTab === 'dashboard' ? '#34495e' : 'transparent',
                  color: 'white',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  borderLeft: activeSidebarTab === 'dashboard' ? '4px solid #3498db' : '4px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (activeSidebarTab !== 'dashboard') {
                    e.target.style.backgroundColor = '#34495e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSidebarTab !== 'dashboard') {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Dashboard
              </button>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <button
                onClick={() => setActiveSidebarTab('documents')}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: activeSidebarTab === 'documents' ? '#34495e' : 'transparent',
                  color: 'white',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  borderLeft: activeSidebarTab === 'documents' ? '4px solid #3498db' : '4px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (activeSidebarTab !== 'documents') {
                    e.target.style.backgroundColor = '#34495e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSidebarTab !== 'documents') {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Document Management
              </button>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <button
                onClick={() => setActiveSidebarTab('history')}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: activeSidebarTab === 'history' ? '#34495e' : 'transparent',
                  color: 'white',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  borderLeft: activeSidebarTab === 'history' ? '4px solid #3498db' : '4px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (activeSidebarTab !== 'history') {
                    e.target.style.backgroundColor = '#34495e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSidebarTab !== 'history') {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                History Logs
              </button>
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
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
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

      {/* Main Content */}
      <div style={{ 
        flexGrow: 1, 
        padding: '20px', 
        backgroundColor: '#ecf0f1',
        marginLeft: '250px',
        minHeight: '100vh'
      }}>
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '8px',
          marginBottom: '15px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ 
              margin: '0', 
              fontSize: '22px', 
              fontWeight: '700' 
            }}>
              Welcome{user ? `, ${user.username}` : ''} to Employee Dashboard
            </h1>
            {employee && (
              <p style={{
                margin: '5px 0 0 0',
                fontSize: '13px',
                opacity: '0.9'
              }}>
                {employee.position} • {employee.department}
              </p>
            )}
          </div>
          
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '15px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <NotificationSystem variant="employee" />
            {user && (
              <button
                onClick={() => setShowUserModal(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '5px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                title="View Profile"
              >
                Profile
              </button>
            )}
          </div>
        </div>

        {/* Conditional Content Based on Active Tab */}
        {activeSidebarTab === 'dashboard' && (
          <>
            {/* Summary Statistics Table */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '15px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              border: '1px solid #f1f3f4'
            }}>
              <h2 style={{ 
                margin: '0 0 15px 0', 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                Document Summary
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                {/* Total Documents */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '2px solid #e9ecef'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    marginBottom: '4px'
                  }}>
                    {summaryStats.total}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#6c757d',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}>
                    Total
                  </div>
                </div>

                {/* Incoming Documents */}
                <div style={{
                  backgroundColor: '#e3f2fd',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '2px solid #bbdefb'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#1976d2',
                    marginBottom: '4px'
                  }}>
                    {summaryStats.incoming}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#1565c0',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}>
                    Incoming
                  </div>
                </div>

                {/* Outgoing Documents */}
                <div style={{
                  backgroundColor: '#e8f5e8',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '2px solid #c8e6c9'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#388e3c',
                    marginBottom: '4px'
                  }}>
                    {summaryStats.outgoing}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#2e7d32',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}>
                    Outgoing
                  </div>
                </div>

                {/* Active Status */}
                <div style={{
                  backgroundColor: '#fff3e0',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '2px solid #ffcc02'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#f57c00',
                    marginBottom: '4px'
                  }}>
                    {summaryStats.active}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#ef6c00',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}>
                    Active
                  </div>
                </div>

                {/* Pending Status */}
                <div style={{
                  backgroundColor: '#fce4ec',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '2px solid #f8bbd9'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#c2185b',
                    marginBottom: '4px'
                  }}>
                    {summaryStats.pending}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#ad1457',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}>
                    Pending
                  </div>
                </div>

                {/* Completed Status */}
                <div style={{
                  backgroundColor: '#e0f2f1',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '2px solid #b2dfdb'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#00796b',
                    marginBottom: '4px'
                  }}>
                    {summaryStats.completed}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#00695c',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}>
                    Completed
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions and Recent Activity Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              {/* Quick Actions */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                padding: '18px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                border: '1px solid #f1f3f4'
              }}>
                <h3 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: '#2c3e50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  Quick Actions
                </h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <button
                    onClick={handleOpenDocumentModal}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
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
                    Add New Document
                  </button>
                  <button
                    onClick={() => setActiveSidebarTab('documents')}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#229954';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#27ae60';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Manage Documents
                  </button>
                  <button
                    onClick={() => setShowUserModal(true)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#9b59b6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#8e44ad';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#9b59b6';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    View Profile
                  </button>
                </div>
              </div>

            </div>

          </>
        )}

        {activeSidebarTab === 'documents' && (
          /* Documents Table */
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            border: '1px solid #f1f3f4'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                Document Management
              </h2>
              <button
                onClick={handleOpenDocumentModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#27ae60',
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
                  e.target.style.backgroundColor = '#229954';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#27ae60';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Add New Document
              </button>
            </div>

            {/* Search and Filter Controls */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '15px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: '1',
                  minWidth: '250px',
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
                <option value="All">All Status</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Processing">Processing</option>
              </select>
              <select
                value={submitterFilter}
                onChange={(e) => setSubmitterFilter(e.target.value)}
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
                <option value="All">All Submitters</option>
                {getUniqueSubmitters().map(submitter => (
                  <option key={submitter} value={submitter}>{submitter}</option>
                ))}
              </select>
            </div>
            
            {loading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                fontSize: '18px',
                color: '#7f8c8d'
              }}>
                Loading documents...
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ 
                        border: '1px solid #ddd', 
                        padding: '12px 10px', 
                        textAlign: 'left', 
                        backgroundColor: '#f8f9fa',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        whiteSpace: 'nowrap'
                      }}>
                        ID
                      </th>
                      <th style={{ 
                        border: '1px solid #ddd', 
                        padding: '12px 10px', 
                        textAlign: 'left', 
                        backgroundColor: '#f8f9fa',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        whiteSpace: 'nowrap'
                      }}>
                        Name
                      </th>
                      <th style={{ 
                        border: '1px solid #ddd', 
                        padding: '12px 10px', 
                        textAlign: 'left', 
                        backgroundColor: '#f8f9fa',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        whiteSpace: 'nowrap'
                      }}>
                        Submitted By
                      </th>
                      <th style={{ 
                        border: '1px solid #ddd', 
                        padding: '12px 8px', 
                        textAlign: 'left', 
                        backgroundColor: '#f8f9fa',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        whiteSpace: 'nowrap'
                      }}>
                        Type
                      </th>
                      <th style={{ 
                        border: '1px solid #ddd', 
                        padding: '12px 8px', 
                        textAlign: 'left', 
                        backgroundColor: '#f8f9fa',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        whiteSpace: 'nowrap'
                      }}>
                        Date
                      </th>
                      <th style={{ 
                        border: '1px solid #ddd', 
                        padding: '12px 8px', 
                        textAlign: 'left', 
                        backgroundColor: '#f8f9fa',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        whiteSpace: 'nowrap'
                      }}>
                        Status
                      </th>
                      <th style={{ 
                        border: '1px solid #ddd', 
                        padding: '12px 8px', 
                        textAlign: 'left', 
                        backgroundColor: '#f8f9fa',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        whiteSpace: 'nowrap'
                      }}>
                        Reviewer
                      </th>
                      <th style={{ 
                        border: '1px solid #ddd', 
                        padding: '12px 8px', 
                        textAlign: 'center', 
                        backgroundColor: '#f8f9fa',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        whiteSpace: 'nowrap'
                      }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.length > 0 ? (
                      filteredDocuments.map((document) => (
                        <tr key={document._id} style={{ cursor: 'pointer' }} onClick={() => handleDocumentClick(document)}>
                          <td style={{ 
                            border: '1px solid #ddd', 
                            padding: '10px',
                            fontSize: '13px',
                            color: '#2c3e50'
                          }}>
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
                          <td style={{ 
                            border: '1px solid #ddd', 
                            padding: '10px',
                            fontSize: '14px',
                            color: '#2c3e50',
                            maxWidth: '250px'
                          }}>
                            <div>
                              <div style={{ fontWeight: '600', marginBottom: '2px' }}>{document.name}</div>
                              {document.description && (
                                <div style={{ fontSize: '11px', color: '#7f8c8d' }}>
                                  {document.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ 
                            border: '1px solid #ddd', 
                            padding: '10px',
                            fontSize: '13px',
                            color: '#2c3e50',
                            fontWeight: '500'
                          }}>
                            {document.submittedBy || 'Unknown'}
                          </td>
                          <td style={{ 
                            border: '1px solid #ddd', 
                            padding: '10px 8px',
                            fontSize: '13px',
                            color: '#2c3e50'
                          }}>
                            <span style={{
                              backgroundColor: '#e8f5e8',
                              color: '#388e3c',
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '600',
                              textTransform: 'uppercase'
                            }}>
                              {document.type}
                            </span>
                          </td>
                          <td style={{ 
                            border: '1px solid #ddd', 
                            padding: '10px 8px',
                            fontSize: '12px',
                            color: '#7f8c8d',
                            whiteSpace: 'nowrap'
                          }}>
                            {document.dateUploaded ? new Date(document.dateUploaded).toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={{ 
                            border: '1px solid #ddd', 
                            padding: '10px 8px',
                            fontSize: '13px'
                          }}>
                            <span style={{
                              backgroundColor: getStatusColor(document.status),
                              color: 'white',
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap'
                            }}>
                              {document.status || 'Submitted'}
                            </span>
                          </td>
                          <td style={{ 
                            border: '1px solid #ddd', 
                            padding: '10px 8px',
                            fontSize: '13px',
                            color: '#7f8c8d'
                          }}>
                            {document.reviewer || '-'}
                          </td>
                          <td style={{ 
                            border: '1px solid #ddd', 
                            padding: '10px 8px',
                            fontSize: '13px'
                          }}>
                            <div style={{
                              display: 'flex',
                              gap: '5px',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDocumentClick(document);
                                }}
                                style={{
                                  backgroundColor: '#3498db',
                                  color: 'white',
                                  border: 'none',
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#2980b9';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = '#3498db';
                                }}
                              >
                                Review
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTrackDocument(document);
                                }}
                                style={{
                                  backgroundColor: '#f39c12',
                                  color: 'white',
                                  border: 'none',
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#e67e22';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = '#f39c12';
                                }}
                              >
                                Track
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(document._id);
                                }}
                                style={{
                                  backgroundColor: '#e74c3c',
                                  color: 'white',
                                  border: 'none',
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#c0392b';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = '#e74c3c';
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td 
                          colSpan="8" 
                          style={{ 
                            border: '1px solid #ddd', 
                            padding: '40px',
                            textAlign: 'center',
                            color: '#95a5a6',
                            fontSize: '16px'
                          }}
                        >
                          <h3 style={{ margin: '0 0 8px 0', color: '#7f8c8d', fontSize: '16px' }}>No documents found</h3>
                          <p style={{ margin: 0, fontSize: '14px' }}>Try adjusting your search or filter criteria</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* History Logs Section */}
        {activeSidebarTab === 'history' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '24px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              📋 Document History Logs
            </h2>

            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
                View the complete routing history and audit trail for all documents. 
                Click "Review" on any document in the Document Management section to see its detailed history.
              </p>
            </div>

            {/* All Documents with History */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: 'white',
                fontSize: '13px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#3498db', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2980b9' }}>Document ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2980b9' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2980b9' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2980b9' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2980b9' }}>Last Reviewer</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2980b9' }}>Current Location</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2980b9' }}>Last Updated</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #2980b9' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allDocuments.length > 0 ? (
                    allDocuments.map((doc) => (
                      <tr key={doc._id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                        <td style={{ padding: '12px', color: '#7f8c8d' }}>{doc.documentId}</td>
                        <td style={{ padding: '12px', fontWeight: '500', color: '#2c3e50' }}>{doc.name}</td>
                        <td style={{ padding: '12px' }}>
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
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: getStatusColor(doc.status),
                            color: 'white'
                          }}>
                            {doc.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#2c3e50', fontWeight: '500' }}>
                          {doc.reviewer || 'Not yet reviewed'}
                        </td>
                        <td style={{ padding: '12px', color: '#7f8c8d' }}>
                          {doc.currentOffice || doc.nextOffice || 'N/A'}
                        </td>
                        <td style={{ padding: '12px', color: '#7f8c8d' }}>
                          {doc.reviewDate ? new Date(doc.reviewDate).toLocaleDateString() : 
                           new Date(doc.dateUploaded).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDocumentClick(doc)}
                            style={{
                              backgroundColor: '#3498db',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'background-color 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
                          >
                            View History
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: '#95a5a6'
                      }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>No documents found</h3>
                        <p style={{ margin: 0, fontSize: '14px' }}>Documents will appear here once submitted</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* User Profile Modal */}
      {showUserModal && (
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
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowUserModal(false)}
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
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#3498db',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px',
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'white'
              }}>
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <h2 style={{
                margin: '0 0 5px 0',
                fontSize: '24px',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                {user?.username || 'User Profile'}
              </h2>
              <p style={{
                margin: 0,
                fontSize: '16px',
                color: '#7f8c8d'
              }}>
                {user?.email}
              </p>
            </div>

            {/* User Information */}
            <div style={{ marginBottom: '25px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                borderBottom: '1px solid #ecf0f1',
                paddingBottom: '8px'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Account Information
                </h3>
                {!isEditing && (
                  <button
                    onClick={handleEditClick}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#2980b9';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#3498db';
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #f8f9fa'
                }}>
                  <span style={{ color: '#7f8c8d', fontWeight: '500' }}>Username:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '200px'
                      }}
                    />
                  ) : (
                    <span style={{ color: '#2c3e50', fontWeight: '600' }}>{user?.username || 'N/A'}</span>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #f8f9fa'
                }}>
                  <span style={{ color: '#7f8c8d', fontWeight: '500' }}>Email:</span>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '200px'
                      }}
                    />
                  ) : (
                    <span style={{ color: '#2c3e50', fontWeight: '600' }}>{user?.email || 'N/A'}</span>
                  )}
                </div>
                {isEditing && (
                  <>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #f8f9fa'
                    }}>
                      <span style={{ color: '#7f8c8d', fontWeight: '500' }}>New Password:</span>
                      <input
                        type="password"
                        value={editForm.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Leave blank to keep current password"
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          width: '200px'
                        }}
                      />
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #f8f9fa'
                    }}>
                      <span style={{ color: '#7f8c8d', fontWeight: '500' }}>Confirm Password:</span>
                      <input
                        type="password"
                        value={editForm.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm new password"
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          width: '200px'
                        }}
                      />
                    </div>
                  </>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #f8f9fa'
                }}>
                  <span style={{ color: '#7f8c8d', fontWeight: '500' }}>Role:</span>
                  <span style={{ 
                    color: '#388e3c', 
                    fontWeight: '600',
                    backgroundColor: '#e8f5e8',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}>
                    {user?.role || 'Employee'}
                  </span>
                </div>
              </div>
            </div>

            {/* Employee Information */}
            {employee && (
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{
                  margin: '0 0 15px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  borderBottom: '1px solid #ecf0f1',
                  paddingBottom: '8px'
                }}>
                  Employee Information
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #f8f9fa'
                  }}>
                    <span style={{ color: '#7f8c8d', fontWeight: '500' }}>Employee ID:</span>
                    <span style={{ color: '#2c3e50', fontWeight: '600' }}>{employee.employeeId}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #f8f9fa'
                  }}>
                    <span style={{ color: '#7f8c8d', fontWeight: '500' }}>Position:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.position}
                        onChange={(e) => handleInputChange('position', e.target.value)}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          width: '200px'
                        }}
                      />
                    ) : (
                      <span style={{ color: '#2c3e50', fontWeight: '600' }}>{employee.position}</span>
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #f8f9fa'
                  }}>
                    <span style={{ color: '#7f8c8d', fontWeight: '500' }}>Department:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          width: '200px'
                        }}
                      />
                    ) : (
                      <span style={{ color: '#2c3e50', fontWeight: '600' }}>{employee.department}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '2px solid #ecf0f1'
            }}>
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveProfile}
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
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
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
                </>
              ) : (
                <button
                  onClick={() => setShowUserModal(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#2980b9';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#3498db';
                  }}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showDocumentModal && (
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
              onClick={handleCloseDocumentModal}
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
                Add New Document
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
                  value={documentForm.sender}
                  onChange={(e) => handleDocumentInputChange('sender', e.target.value)}
                  placeholder="Sender name (auto-filled)"
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
                  value={documentForm.type}
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
                    value={documentForm.date}
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
                    value={documentForm.time}
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
                    value={selectedOffice}
                    onChange={(e) => handleOfficeChange(e.target.value)}
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
                    value={documentForm.receiver}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    disabled={!selectedOffice}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: selectedOffice ? 'white' : '#f8f9fa',
                      cursor: selectedOffice ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
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
                  value={documentForm.notes}
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
                {documentForm.attachment && (
                  <p style={{
                    margin: '8px 0 0 0',
                    fontSize: '12px',
                    color: '#27ae60'
                  }}>
                    Selected: {documentForm.attachment.name}
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
                Add Document
              </button>
              <button
                onClick={handleCloseDocumentModal}
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

      {/* Document Review Modal */}
      {showReviewModal && selectedDocument && (
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
                📄 Document Review
              </h2>
            </div>

            {/* Workflow Progress Bar */}
            {(() => {
              // Define workflow stages based on document type
              const getWorkflowStages = () => {
                const docType = selectedDocument.type?.toUpperCase() || '';
                const category = selectedDocument.category || '';
                
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

              const stages = getWorkflowStages();
              const currentOffice = selectedDocument.currentOffice || selectedDocument.nextOffice || 'Program Head';
              
              const isWorkflowComplete = isDocumentWorkflowComplete(selectedDocument);

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
                    📋 Progress
                  </h4>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}>
                    {stages.map((stage, index) => {
                      const isLastStage = index === stages.length - 1;
                      
                      const isCompleted = index < currentStageIndex || (isWorkflowComplete && index === currentStageIndex);
                      const isCurrent = !isWorkflowComplete && index === currentStageIndex;
                      const isPending = index > currentStageIndex && !(isWorkflowComplete && index === currentStageIndex);
                      
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
                  {selectedDocument.documentId}
                </code>
                <h3 style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  {selectedDocument.name}
                </h3>
              </div>
              {selectedDocument.description && (
                <p style={{
                  margin: '0 0 6px 0',
                  color: '#6c757d',
                  fontSize: '11px'
                }}>
                  {selectedDocument.description}
                </p>
              )}
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <span style={{
                  backgroundColor: getStatusColor(selectedDocument.status),
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px'
                }}>
                  {getStatusIcon(selectedDocument.status)} {selectedDocument.status || 'Submitted'}
                </span>
                <span style={{
                  color: '#6c757d',
                  fontSize: '10px'
                }}>
                  Submitted by: {selectedDocument.submittedBy || 'Unknown'}
                </span>
                <span style={{
                  color: '#6c757d',
                  fontSize: '10px'
                }}>
                  Date: {selectedDocument.dateUploaded ? new Date(selectedDocument.dateUploaded).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Review Form */}
            <div style={{ display: 'grid', gap: '10px' }}>
              {/* Status Update */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Update Status *
                </label>
                <select
                  value={reviewForm.status}
                  onChange={(e) => handleReviewInputChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '5px',
                    fontSize: '12px',
                    backgroundColor: 'white',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Processing">Processing</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

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

              {/* Forward to Next Office */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Forward to Next Office (Optional)
                </label>
                <select
                  value={reviewForm.nextOffice}
                  onChange={(e) => handleReviewInputChange('nextOffice', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '5px',
                    fontSize: '12px',
                    backgroundColor: 'white',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
                >
                  <option value="">-- Don't Forward --</option>
                  {offices.map(office => (
                    <option key={office._id} value={office.name}>
                      {office.name}
                    </option>
                  ))}
                </select>
                {reviewForm.nextOffice && (
                  <p style={{
                    margin: '8px 0 0 0',
                    fontSize: '12px',
                    color: '#27ae60',
                    fontStyle: 'italic'
                  }}>
                    ✓ Document will be forwarded to {reviewForm.nextOffice}
                  </p>
                )}
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
                  rows="2"
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    border: '2px solid #e1e8ed',
                    borderRadius: '5px',
                    fontSize: '12px',
                    resize: 'vertical',
                    overflowX: 'hidden',
                    wordWrap: 'break-word',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
                />
              </div>
            </div>

            {/* Routing History / Audit Log */}
            {selectedDocument?.routingHistory && selectedDocument.routingHistory.length > 0 && (
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
                  color: '#2c3e50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  📋 Routing History
                </h3>
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {selectedDocument.routingHistory.map((entry, index) => (
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
                        {entry.action || 'Updated'}
                        {entry.fromOffice && entry.toOffice && (
                          <span style={{ color: '#7f8c8d', fontWeight: 'normal' }}>
                            {' '}: {entry.fromOffice} → {entry.toOffice}
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#7f8c8d', fontSize: '10px' }}>
                        By: {entry.performedBy || 'Unknown'} • {new Date(entry.date).toLocaleString()}
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

            {/* Quick Actions - Show if document is at current user's office (even if already approved) */}
            {(() => {
              // Show approval buttons if document is at user's office, regardless of approval status
              // This allows users to approve/update documents even if they're already marked as approved
              const isAtUserOffice = positionMatchesOffice(employee?.position, selectedDocument?.currentOffice) || 
                                     positionMatchesOffice(employee?.position, selectedDocument?.nextOffice);
              
              // Also show for final approvers (VP, Academic VP, OP) if document is at their position
              const isFinalApprover = positionMatchesOffice(employee?.position, 'Academic Vice President') ||
                                      positionMatchesOffice(employee?.position, 'Academic VP') ||
                                      positionMatchesOffice(employee?.position, 'Vice President') ||
                                      positionMatchesOffice(employee?.position, 'VP') ||
                                      positionMatchesOffice(employee?.position, 'Office of the President') ||
                                      positionMatchesOffice(employee?.position, 'President') ||
                                      positionMatchesOffice(employee?.position, 'OP');
              
              const isAtFinalApproverOffice = isFinalApprover && 
                (selectedDocument?.currentOffice === employee?.position || 
                 selectedDocument?.nextOffice === employee?.position ||
                 selectedDocument?.currentOffice === 'VP' ||
                 selectedDocument?.currentOffice === 'Vice President' ||
                 selectedDocument?.nextOffice === 'VP' ||
                 selectedDocument?.nextOffice === 'Vice President');
              
              return employee && (isAtUserOffice || isAtFinalApproverOffice);
            })() && (
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '2px solid #ecf0f1'
              }}>
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  textAlign: 'center'
                }}>
                  🎯 Quick Actions
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '10px'
                }}>
                  {getNextOffice() && (
                    <>
                      <button
                        onClick={handleApproveAndForward}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#27ae60',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#229954';
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 4px 8px rgba(39,174,96,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#27ae60';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>✓</span>
                        Approve & Forward to {getNextOffice()}
                      </button>
                      <button
                        onClick={handleForwardToNext}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#2980b9';
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 4px 8px rgba(52,152,219,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#3498db';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>→</span>
                        Forward to {getNextOffice()}
                      </button>
                    </>
                  )}
                  {(!getNextOffice() && (
                    positionMatchesOffice(employee?.position, 'Academic Vice President') ||
                    positionMatchesOffice(employee?.position, 'Academic VP') ||
                    positionMatchesOffice(employee?.position, 'Vice President') ||
                    positionMatchesOffice(employee?.position, 'VP') ||
                    positionMatchesOffice(employee?.position, 'Office of the President') ||
                    positionMatchesOffice(employee?.position, 'President') ||
                    positionMatchesOffice(employee?.position, 'OP')
                  )) && (
                    <button
                      onClick={handleFinalApprove}
                      style={{
                        padding: '14px 20px',
                        backgroundColor: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#229954';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(39,174,96,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#27ae60';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>✓</span>
                      Final Approve
                    </button>
                  )}
                  {/* Show Reject & Return button for all positions */}
                  <button
                    onClick={handleRejectAndReturn}
                      style={{
                        padding: '14px 20px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#c0392b';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(231,76,60,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#e74c3c';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>✗</span>
                      Reject & Return
                    </button>
                </div>
                <p style={{
                  margin: '12px 0 0 0',
                  fontSize: '12px',
                  color: '#7f8c8d',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  Click a quick action above for instant processing
                </p>
              </div>
            )}

            {/* Advanced Options - Show if document is at current user's office */}
            {(() => {
              // Allow approval if document is at user's office, even if already approved
              // This allows users to update/change approval status
              return employee && (
                positionMatchesOffice(employee?.position, selectedDocument?.currentOffice) || 
                positionMatchesOffice(employee?.position, selectedDocument?.nextOffice) ||
                // Also show if user is a final approver and document is at their position
                ((positionMatchesOffice(employee?.position, 'Academic Vice President') ||
                  positionMatchesOffice(employee?.position, 'Academic VP') ||
                  positionMatchesOffice(employee?.position, 'Vice President') ||
                  positionMatchesOffice(employee?.position, 'VP') ||
                  positionMatchesOffice(employee?.position, 'Office of the President') ||
                  positionMatchesOffice(employee?.position, 'President') ||
                  positionMatchesOffice(employee?.position, 'OP')) &&
                 (selectedDocument?.currentOffice === employee?.position || 
                  selectedDocument?.nextOffice === employee?.position))
              );
            })() && (
              <div style={{
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid #ecf0f1'
              }}>
                <details style={{ cursor: 'pointer' }}>
                  <summary style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#7f8c8d',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    textAlign: 'center',
                    userSelect: 'none'
                  }}>
                    ⚙️ Advanced Options
                  </summary>
                <div style={{
                  marginTop: '15px',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={handleUpdateDocumentStatus}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
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
                    Manual Update
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteDocument(selectedDocument._id);
                      handleCloseReviewModal();
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
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
                    Delete
                  </button>
                  <button
                    onClick={handleCloseReviewModal}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
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
              </details>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Document Tracking Modal */}
      {showTrackModal && trackedDocument && (
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
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={handleCloseTrackModal}
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
                Document Tracking
              </h2>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#7f8c8d'
              }}>
                Track the progress of your document
              </p>
            </div>

            {/* Document Info */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '25px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <code style={{
                  backgroundColor: '#e9ecef',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#495057',
                  marginRight: '10px'
                }}>
                  {trackedDocument.documentId}
                </code>
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  {trackedDocument.name}
                </h3>
              </div>
              {trackedDocument.description && (
                <p style={{
                  margin: '0 0 10px 0',
                  color: '#6c757d',
                  fontSize: '14px'
                }}>
                  {trackedDocument.description}
                </p>
              )}
              <div style={{
                display: 'flex',
                gap: '15px',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  backgroundColor: getStatusColor(trackedDocument.status),
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {getStatusIcon(trackedDocument.status)} {trackedDocument.status || 'Submitted'}
                </span>
                <span style={{
                  color: '#6c757d',
                  fontSize: '14px'
                }}>
                  Submitted: {trackedDocument.dateUploaded ? new Date(trackedDocument.dateUploaded).toLocaleDateString() : 'N/A'}
                </span>
                <span style={{
                  color: '#6c757d',
                  fontSize: '14px'
                }}>
                  By: {trackedDocument.submittedBy || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div>
              <h4 style={{
                margin: '0 0 20px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                📈 Processing Timeline
              </h4>
              
              <div style={{ position: 'relative' }}>
                {getTimelineSteps(trackedDocument).map((step, index) => (
                  <div key={step.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: index < getTimelineSteps(trackedDocument).length - 1 ? '25px' : '0'
                  }}>
                    {/* Timeline Line */}
                    {index < getTimelineSteps(trackedDocument).length - 1 && (
                      <div style={{
                        position: 'absolute',
                        left: '15px',
                        top: '35px',
                        width: '2px',
                        height: '50px',
                        backgroundColor: step.completed ? '#28a745' : '#e9ecef',
                        zIndex: 1
                      }} />
                    )}
                    
                    {/* Step Icon */}
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: step.completed 
                        ? (step.isRejected ? '#dc3545' : '#28a745')
                        : step.active 
                          ? '#007bff' 
                          : '#e9ecef',
                      color: step.completed || step.active ? 'white' : '#6c757d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginRight: '15px',
                      zIndex: 2,
                      position: 'relative'
                    }}>
                      {step.completed ? (step.isRejected ? 'X' : '✓') : step.active ? '-' : '○'}
                    </div>
                    
                    {/* Step Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '5px'
                      }}>
                        <h5 style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: '600',
                          color: step.completed || step.active ? '#2c3e50' : '#6c757d'
                        }}>
                          {step.title}
                        </h5>
                        {step.date && (
                          <span style={{
                            fontSize: '12px',
                            color: '#6c757d',
                            backgroundColor: '#f8f9fa',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            {step.date}
                          </span>
                        )}
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#6c757d',
                        lineHeight: '1.4'
                      }}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            {trackedDocument.comments && (
              <div style={{
                marginTop: '25px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #007bff'
              }}>
                <h5 style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  💬 Reviewer Comments:
                </h5>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#6c757d',
                  lineHeight: '1.4'
                }}>
                  {trackedDocument.comments}
                </p>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '2px solid #ecf0f1'
            }}>
              <button
                onClick={handleCloseTrackModal}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2980b9';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#3498db';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Document Confirmation Modal */}
      {showDeleteDocumentModal && documentToDelete && (
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
        onClick={cancelDeleteDocument}
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
              Are you sure you want to delete <strong>"{documentToDelete.name}"</strong>? This action cannot be undone.
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cancelDeleteDocument}
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
                onClick={confirmDeleteDocument}
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

      {/* Notification */}
      {showNotificationPane && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px 24px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e5e7eb',
          zIndex: 2001,
          minWidth: '320px',
          maxWidth: '400px',
          animation: 'slideInUp 0.3s ease-out',
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
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
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

export default Edashboard;
