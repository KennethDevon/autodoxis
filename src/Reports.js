import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import DailyActivityReport from './components/DailyActivityReport';
import NotificationSystem from './components/NotificationSystem';
import API_URL from './config';

function Reports() {
  const [employees, setEmployees] = useState([]);
  const [offices, setOffices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOffices, setExpandedOffices] = useState(new Set());
  const [expandedDepartments, setExpandedDepartments] = useState(new Set());
  const [expandedDocTypes, setExpandedDocTypes] = useState(new Set());
  const [expandedRecentDocs, setExpandedRecentDocs] = useState(new Set());
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'daily', or 'trends'

  const toggleOffice = (officeId) => {
    const newExpanded = new Set(expandedOffices);
    if (newExpanded.has(officeId)) {
      newExpanded.delete(officeId);
    } else {
      newExpanded.add(officeId);
    }
    setExpandedOffices(newExpanded);
  };

  const toggleDepartment = (deptName) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(deptName)) {
      newExpanded.delete(deptName);
    } else {
      newExpanded.add(deptName);
    }
    setExpandedDepartments(newExpanded);
  };

  const toggleDocType = (typeName) => {
    const newExpanded = new Set(expandedDocTypes);
    if (newExpanded.has(typeName)) {
      newExpanded.delete(typeName);
    } else {
      newExpanded.add(typeName);
    }
    setExpandedDocTypes(newExpanded);
  };

  const toggleRecentDoc = (docId) => {
    const newExpanded = new Set(expandedRecentDocs);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedRecentDocs(newExpanded);
  };


  useEffect(() => {
    fetchAllData();
    
    // Optional: Set up interval to refresh every 30 seconds for real-time updates
    // Uncomment the lines below if you want automatic refreshing
    // const interval = setInterval(() => {
    //   fetchAllData();
    // }, 30000); // Refresh every 30 seconds
    
    // return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [employeesRes, officesRes, documentsRes, docTypesRes] = await Promise.all([
        fetch(`${API_URL}/employees`),
        fetch(`${API_URL}/offices`),
        fetch(`${API_URL}/documents`),
        fetch(`${API_URL}/document-types`)
      ]);

      const employeesData = await employeesRes.json();
      const officesData = await officesRes.json();
      const documentsData = await documentsRes.json();
      const docTypesData = await docTypesRes.json();

      setEmployees(employeesData);
      setOffices(officesData);
      setDocuments(documentsData);
      setDocumentTypes(docTypesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const getEmployeesByDepartment = () => {
    const departments = {};
    employees.forEach(emp => {
      departments[emp.department] = (departments[emp.department] || 0) + 1;
    });
    return departments;
  };

  const getDocumentsByType = () => {
    const types = {};
    
    // Initialize all document types with 0 count
    documentTypes.forEach(docType => {
      types[docType.name] = 0;
    });
    
    // Count actual documents
    documents.forEach(doc => {
      if (types.hasOwnProperty(doc.type)) {
        types[doc.type] += 1;
      } else {
        // If document type not in list, still count it
        types[doc.type] = (types[doc.type] || 0) + 1;
      }
    });
    
    return types;
  };


  const getRecentDocuments = () => {
    return documents
      .sort((a, b) => new Date(b.dateUploaded) - new Date(a.dateUploaded))
      .slice(0, 5);
  };


  // Helper function to format hours into readable format (used in component, defined later inline)
  // eslint-disable-next-line no-unused-vars
  const formatHours = (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)} hrs`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      if (remainingHours < 1) {
        return `${days} day${days > 1 ? 's' : ''}`;
      }
      return `${days} day${days > 1 ? 's' : ''} ${remainingHours.toFixed(1)} hrs`;
    }
  };

  // Download report functions
  const downloadEmployeesReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Employees Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    
    const tableData = employees.map(emp => [
      emp.name,
      emp.employeeId,
      emp.position,
      emp.department,
      emp.office?.name || 'N/A'
    ]);
    
    doc.autoTable({
      head: [['Name', 'Employee ID', 'Position', 'Department', 'Office']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] }
    });
    
    doc.save('Employees_Report.pdf');
  };

  const downloadOfficesReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Offices Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    
    const tableData = offices.map(office => [
      office.name,
      office.department,
      office.location || 'N/A',
      office.numberOfEmployees || 0
    ]);
    
    doc.autoTable({
      head: [['Office Name', 'Department', 'Location', 'Employees']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [123, 31, 162] }
    });
    
    doc.save('Offices_Report.pdf');
  };

  const downloadDocumentsReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Documents Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    
    const tableData = documents.map(d => [
      d.documentId,
      d.name,
      d.type,
      d.status || 'Submitted',
      d.submittedBy,
      d.dateUploaded ? new Date(d.dateUploaded).toLocaleDateString() : 'N/A'
    ]);
    
    doc.autoTable({
      head: [['ID', 'Name', 'Type', 'Status', 'Submitted By', 'Date']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [56, 142, 60] },
      styles: { fontSize: 8 }
    });
    
    doc.save('Documents_Report.pdf');
  };

  const downloadEmployeesByDepartmentReport = () => {
    const doc = new jsPDF();
    const employeesByDepartment = getEmployeesByDepartment();
    
    doc.setFontSize(18);
    doc.text('Employees by Department', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    
    const tableData = Object.entries(employeesByDepartment).map(([dept, count]) => [
      dept,
      count
    ]);
    
    doc.autoTable({
      head: [['Department', 'Number of Employees']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [245, 124, 0] }
    });
    
    doc.save('Employees_By_Department_Report.pdf');
  };

  const downloadDocumentsByTypeReport = () => {
    const doc = new jsPDF();
    const documentsByType = getDocumentsByType();
    
    doc.setFontSize(18);
    doc.text('Documents by Type', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    
    const tableData = Object.entries(documentsByType).map(([type, count]) => [
      type,
      count
    ]);
    
    doc.autoTable({
      head: [['Document Type', 'Number of Documents']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [211, 47, 47] }
    });
    
    doc.save('Documents_By_Type_Report.pdf');
  };

  const downloadFullSystemReport = () => {
    const doc = new jsPDF();
    const employeesByDepartment = getEmployeesByDepartment();
    const documentsByType = getDocumentsByType();
    
    let yPos = 20;
    
    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('System Summary Report', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
    yPos += 15;
    
    // Overview Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Overview', 14, yPos);
    yPos += 8;
    
    doc.autoTable({
      body: [
        ['Total Employees', employees.length],
        ['Total Offices', offices.length],
        ['Total Documents', documents.length]
      ],
      startY: yPos,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      columnStyles: { 0: { fontStyle: 'bold' } }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
    
    // Employees by Department
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Employees by Department', 14, yPos);
    yPos += 8;
    
    doc.autoTable({
      head: [['Department', 'Count']],
      body: Object.entries(employeesByDepartment).map(([dept, count]) => [dept, count]),
      startY: yPos,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
    
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Documents by Type
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Documents by Type', 14, yPos);
    yPos += 8;
    
    doc.autoTable({
      head: [['Type', 'Count']],
      body: Object.entries(documentsByType).map(([type, count]) => [type, count]),
      startY: yPos,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
    
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    // Office Details
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Office Details', 14, yPos);
    yPos += 8;
    
    doc.autoTable({
      head: [['Office Name', 'Department', 'Location', 'Employees']],
      body: offices.map(office => [
        office.name,
        office.department,
        office.location || 'N/A',
        office.numberOfEmployees || 0
      ]),
      startY: yPos,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      styles: { fontSize: 9 }
    });
    
    doc.save('Full_System_Report.pdf');
  };


  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading Reports...</h2>
      </div>
    );
  }

  const employeesByDepartment = getEmployeesByDepartment();
  const documentsByType = getDocumentsByType();
  const recentDocuments = getRecentDocuments();

  return (
    <div>
      {/* Header with Report Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <NotificationSystem />
          <button
            onClick={() => setShowReportModal(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        borderBottom: '2px solid #e1e8ed',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'overview' ? '#3498db' : 'transparent',
            color: activeTab === 'overview' ? 'white' : '#2c3e50',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '3px solid #2980b9' : '3px solid transparent',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderRadius: '6px 6px 0 0',
            whiteSpace: 'nowrap'
          }}
        >
          Overview & Statistics
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'daily' ? '#3498db' : 'transparent',
            color: activeTab === 'daily' ? 'white' : '#2c3e50',
            border: 'none',
            borderBottom: activeTab === 'daily' ? '3px solid #2980b9' : '3px solid transparent',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderRadius: '6px 6px 0 0',
            whiteSpace: 'nowrap'
          }}
        >
          Daily Activity Report
        </button>
        <button
          onClick={() => setActiveTab('delays')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'delays' ? '#3498db' : 'transparent',
            color: activeTab === 'delays' ? 'white' : '#2c3e50',
            border: 'none',
            borderBottom: activeTab === 'delays' ? '3px solid #2980b9' : '3px solid transparent',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderRadius: '6px 6px 0 0',
            whiteSpace: 'nowrap'
          }}
        >
          Department Delays
        </button>
      </div>

      {/* Conditional Rendering based on Active Tab */}
      {activeTab === 'daily' ? (
        <DailyActivityReport />
      ) : activeTab === 'delays' ? (
        <div>
          {(() => {
            // Helper function to get submitter's department
            const getSubmitterDepartment = (submittedBy) => {
              if (!submittedBy) return null;
              const submitter = employees.find(emp => 
                emp.name?.toLowerCase() === submittedBy.toLowerCase() ||
                emp.name?.toLowerCase().includes(submittedBy.toLowerCase()) ||
                submittedBy.toLowerCase().includes(emp.name?.toLowerCase())
              );
              return submitter ? (submitter.office?.name || submitter.department) : null;
            };

            // Group documents by department
            const documentsByDepartment = {};
            documents.forEach(doc => {
              const dept = getSubmitterDepartment(doc.submittedBy) || 'Unknown';
              if (!documentsByDepartment[dept]) {
                documentsByDepartment[dept] = [];
              }
              documentsByDepartment[dept].push(doc);
            });

            // Helper function to check if document is approved
            const isDocumentApproved = (doc) => {
              return doc.status === 'Approved' || 
                     (doc.status === 'Processing' && !doc.nextOffice) ||
                     (doc.status === 'Approved' && (!doc.nextOffice || doc.nextOffice === ''));
            };
            
            // Calculate delay information for each document
            const calculateDelayInfo = (doc) => {
              const expectedHours = doc.expectedProcessingTime || 24;
              let startTime = null;
              let endTime = new Date(); // Default to current time
              let isApproved = false;
              
              // Check if document is approved - find the final approval time
              if (isDocumentApproved(doc)) {
                // Find the latest approved entry in routing history
                if (doc.routingHistory && doc.routingHistory.length > 0) {
                  const approvedEntries = doc.routingHistory
                    .filter(entry => entry.action === 'approved' || entry.action === 'final approved')
                    .sort((a, b) => {
                      const dateA = new Date(a.timestamp || a.date || 0);
                      const dateB = new Date(b.timestamp || b.date || 0);
                      return dateB - dateA; // Sort descending to get latest first
                    });
                  
                  if (approvedEntries.length > 0) {
                    const latestApproval = approvedEntries[0];
                    const approvedTime = latestApproval.timestamp ? new Date(latestApproval.timestamp) : 
                                      latestApproval.date ? new Date(latestApproval.date) : null;
                    
                    if (approvedTime) {
                      endTime = approvedTime;
                      isApproved = true;
                    }
                  }
                }
                
                // If no routing history entry found but document has reviewDate, use that
                if (!isApproved && doc.reviewDate) {
                  endTime = new Date(doc.reviewDate);
                  isApproved = true;
                }
              }
              
              if (doc.routingHistory && doc.routingHistory.length > 0) {
                const firstEntry = doc.routingHistory[0];
                startTime = firstEntry.timestamp ? new Date(firstEntry.timestamp) : 
                            firstEntry.date ? new Date(firstEntry.date) : 
                            new Date(doc.dateUploaded);
              } else {
                startTime = new Date(doc.dateUploaded);
              }
              
              const timeSpentMs = endTime - startTime;
              const timeSpentHours = timeSpentMs / (1000 * 60 * 60);
              const timeRemainingMs = (expectedHours * 60 * 60 * 1000) - timeSpentMs;
              const isExceeded = timeRemainingMs < 0;
              const delayHours = isExceeded ? Math.abs(timeRemainingMs) / (1000 * 60 * 60) : 0;
              
              const formatTime = (hours) => {
                if (hours < 1) {
                  const minutes = Math.floor(hours * 60);
                  return `${minutes} min`;
                } else if (hours < 24) {
                  const hrs = Math.floor(hours);
                  const mins = Math.floor((hours - hrs) * 60);
                  return `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min`;
                } else {
                  const days = Math.floor(hours / 24);
                  const remainingHours = hours % 24;
                  const hrs = Math.floor(remainingHours);
                  const mins = Math.floor((remainingHours - hrs) * 60);
                  let result = `${days} day${days > 1 ? 's' : ''}`;
                  if (hrs > 0) result += ` ${hrs} hr${hrs > 1 ? 's' : ''}`;
                  if (mins > 0 && days === 0) result += ` ${mins} min`;
                  return result;
                }
              };
              
              return {
                expectedHours,
                timeSpentHours,
                delayHours,
                isExceeded,
                isApproved,
                timeSpent: formatTime(timeSpentHours),
                delayFormatted: delayHours > 0 ? formatTime(delayHours) : null,
                startTime,
                endTime,
                percentage: Math.min((timeSpentHours / expectedHours) * 100, 100)
              };
            };

            const formatHours = (hours) => {
              if (hours < 1) {
                return `${Math.round(hours * 60)} min`;
              } else if (hours < 24) {
                return `${hours.toFixed(1)} hrs`;
              } else {
                const days = Math.floor(hours / 24);
                const remainingHours = hours % 24;
                if (remainingHours < 1) {
                  return `${days} day${days > 1 ? 's' : ''}`;
                }
                return `${days} day${days > 1 ? 's' : ''} ${remainingHours.toFixed(1)} hrs`;
              }
            };

            const getStatusColor = (status) => {
              const colors = {
                'Approved': '#28a745',
                'Processing': '#17a2b8',
                'Under Review': '#ffc107',
                'Rejected': '#dc3545',
                'On Hold': '#6c757d',
                'Completed': '#28a745'
              };
              return colors[status] || '#6c757d';
            };

            // Calculate department statistics
            const departmentStats = Object.keys(documentsByDepartment).map(deptName => {
              const deptDocs = documentsByDepartment[deptName].map(doc => ({
                ...doc,
                delayInfo: calculateDelayInfo(doc)
              }));

              const total = deptDocs.length;
              const delayed = deptDocs.filter(d => d.delayInfo.isExceeded).length;
              const completed = deptDocs.filter(d => d.delayInfo.isApproved || d.status === 'Approved').length;
              const rejected = deptDocs.filter(d => d.status === 'Rejected').length;
              const totalDelayHours = deptDocs
                .filter(d => d.delayInfo.isExceeded)
                .reduce((sum, d) => sum + d.delayInfo.delayHours, 0);
              const avgDelay = delayed > 0 ? totalDelayHours / delayed : 0;

              return {
                department: deptName,
                total,
                delayed,
                completed,
                rejected,
                totalDelayHours,
                averageDelay: avgDelay,
                documents: deptDocs.sort((a, b) => {
                  if (a.delayInfo.isExceeded !== b.delayInfo.isExceeded) {
                    return b.delayInfo.isExceeded - a.delayInfo.isExceeded;
                  }
                  return b.delayInfo.delayHours - a.delayInfo.delayHours;
                })
              };
            }).sort((a, b) => b.delayed - a.delayed || b.totalDelayHours - a.totalDelayHours);

            return (
              <div>
                <h2 style={{
                  margin: '0 0 20px 0',
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Department Delays Analysis
                </h2>

                {departmentStats.map((deptStat) => (
                  <div key={deptStat.department} style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {/* Department Header */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px',
                      paddingBottom: '15px',
                      borderBottom: '2px solid #e0e0e0'
                    }}>
                      <div>
                        <h3 style={{
                          margin: '0 0 5px 0',
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#2c3e50'
                        }}>
                          {deptStat.department}
                        </h3>
                        <div style={{
                          display: 'flex',
                          gap: '20px',
                          fontSize: '13px',
                          color: '#6c757d',
                          flexWrap: 'wrap'
                        }}>
                          <span><strong>Total:</strong> {deptStat.total}</span>
                          <span style={{ color: deptStat.completed > 0 ? '#28a745' : '#6c757d' }}>
                            <strong>Completed:</strong> {deptStat.completed}
                          </span>
                          <span style={{ color: deptStat.rejected > 0 ? '#dc3545' : '#6c757d' }}>
                            <strong>Rejected:</strong> {deptStat.rejected}
                          </span>
                          <span style={{ color: deptStat.delayed > 0 ? '#d32f2f' : '#388e3c' }}>
                            <strong>Delayed:</strong> {deptStat.delayed}
                          </span>
                          {deptStat.delayed > 0 && (
                            <>
                              <span><strong>Total Delay:</strong> {formatHours(deptStat.totalDelayHours)}</span>
                              <span><strong>Avg Delay:</strong> {formatHours(deptStat.averageDelay)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Documents Table */}
                    {deptStat.documents.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                              <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#2c3e50' }}>
                                Document ID
                              </th>
                              <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#2c3e50' }}>
                                Name
                              </th>
                              <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#2c3e50' }}>
                                Type
                              </th>
                              <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#2c3e50' }}>
                                Status
                              </th>
                              <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#2c3e50' }}>
                                Time Spent
                              </th>
                              <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#2c3e50' }}>
                                Expected Time
                              </th>
                              <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#2c3e50' }}>
                                Delay Status
                              </th>
                              <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#2c3e50' }}>
                                Submitted By
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {deptStat.documents.map((doc) => (
                              <tr key={doc._id} style={{ 
                                backgroundColor: doc.delayInfo.isExceeded ? '#fff5f5' : 'white',
                                borderLeft: doc.delayInfo.isExceeded ? '4px solid #dc3545' : 'none'
                              }}>
                                <td style={{ border: '1px solid #ddd', padding: '10px', fontSize: '12px', color: '#2c3e50' }}>
                                  <code style={{
                                    backgroundColor: '#f8f9fa',
                                    padding: '2px 5px',
                                    borderRadius: '3px',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    color: '#6c757d'
                                  }}>
                                    {doc.documentId}
                                  </code>
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '10px', fontSize: '12px', fontWeight: '500', color: '#2c3e50' }}>
                                  {doc.name}
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '10px', fontSize: '12px', color: '#2c3e50' }}>
                                  <span style={{
                                    backgroundColor: '#e8f5e8',
                                    color: '#388e3c',
                                    padding: '2px 6px',
                                    borderRadius: '8px',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase'
                                  }}>
                                    {doc.type || 'N/A'}
                                  </span>
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '10px', fontSize: '12px' }}>
                                  <span style={{
                                    padding: '3px 8px',
                                    borderRadius: '10px',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    backgroundColor: getStatusColor(doc.status || 'Processing'),
                                    color: 'white'
                                  }}>
                                    {doc.status || 'Processing'}
                                  </span>
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '10px', fontSize: '12px', color: '#2c3e50' }}>
                                  {doc.delayInfo.timeSpent}
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '10px', fontSize: '12px', color: '#6c757d' }}>
                                  {formatHours(doc.delayInfo.expectedHours)}
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '10px', fontSize: '12px' }}>
                                  {doc.delayInfo.isExceeded ? (
                                    <span style={{
                                      padding: '3px 8px',
                                      borderRadius: '10px',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                      backgroundColor: '#f8d7da',
                                      color: '#721c24'
                                    }}>
                                      ⚠️ {doc.delayInfo.delayFormatted} over
                                    </span>
                                  ) : (
                                    <span style={{
                                      padding: '3px 8px',
                                      borderRadius: '10px',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                      backgroundColor: '#d4edda',
                                      color: '#155724'
                                    }}>
                                      ✓ On Time
                                    </span>
                                  )}
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '10px', fontSize: '12px', color: '#6c757d' }}>
                                  {doc.submittedBy || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#999',
                        fontSize: '14px'
                      }}>
                        No documents in this department.
                      </div>
                    )}
                  </div>
                ))}

                {departmentStats.length === 0 && (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#999',
                    fontSize: '14px'
                  }}>
                    No documents found to analyze.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        <div>
      
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Total Employees</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: 0, color: '#1976d2' }}>{employees.length}</p>
        </div>
        
        <div style={{ backgroundColor: '#f3e5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>Total Offices</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: 0, color: '#7b1fa2' }}>{offices.length}</p>
        </div>
        
        <div style={{ backgroundColor: '#e8f5e8', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#388e3c' }}>Total Documents</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: 0, color: '#388e3c' }}>{documents.length}</p>
        </div>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        {/* Employees by Department */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Employees by Department</h3>
          <div>
            {Object.entries(employeesByDepartment).map(([dept, count]) => {
              const isExpanded = expandedDepartments.has(dept);
              const deptEmployees = employees.filter(emp => emp.department === dept);
              
              return (
                <div key={dept} style={{ 
                  marginBottom: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: 'white'
                }}>
                  <div
                    onClick={() => toggleDepartment(dept)}
                    style={{
                      padding: '15px',
                      backgroundColor: isExpanded ? '#e3f2fd' : '#f8f9fa',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) e.currentTarget.style.backgroundColor = '#e9ecef';
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                        {dept}
                      </span>
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '600',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2'
                    }}>
                      {count} {count === 1 ? 'Employee' : 'Employees'}
                    </span>
                  </div>
                  
                  {isExpanded && (
                    <div style={{ padding: '15px', borderTop: '1px solid #ddd' }}>
                      {deptEmployees.map((emp, index) => (
                        <div key={emp._id} style={{
                          padding: '10px',
                          backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                          borderRadius: '4px',
                          marginBottom: '5px'
                        }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>
                            {emp.position} • ID: {emp.employeeId}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Documents by Type */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Documents by Type</h3>
          <div>
            {Object.entries(documentsByType).map(([type, count]) => {
              const isExpanded = expandedDocTypes.has(type);
              const typeDocs = documents.filter(doc => doc.type === type);
              
              return (
                <div key={type} style={{ 
                  marginBottom: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: 'white'
                }}>
                  <div
                    onClick={() => toggleDocType(type)}
                    style={{
                      padding: '15px',
                      backgroundColor: isExpanded ? '#f3e5f5' : '#f8f9fa',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) e.currentTarget.style.backgroundColor = '#e9ecef';
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                        {type}
                      </span>
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '600',
                      backgroundColor: '#f3e5f5',
                      color: '#7b1fa2'
                    }}>
                      {count} {count === 1 ? 'Document' : 'Documents'}
                    </span>
                  </div>
                  
                  {isExpanded && (
                    <div style={{ padding: '15px', borderTop: '1px solid #ddd' }}>
                      {typeDocs.map((doc, index) => (
                        <div key={doc._id} style={{
                          padding: '10px',
                          backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                          borderRadius: '4px',
                          marginBottom: '5px'
                        }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                            {doc.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>
                            ID: {doc.documentId} • {doc.dateUploaded ? new Date(doc.dateUploaded).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        {/* Office Details */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Office Details</h3>
        <div>
          {offices.map((office) => {
            const isExpanded = expandedOffices.has(office._id);
            const officeEmployees = employees.filter(emp => emp.office?._id === office._id);
            
            return (
              <div key={office._id} style={{ 
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'white'
              }}>
                <div
                  onClick={() => toggleOffice(office._id)}
                  style={{
                    padding: '15px',
                    backgroundColor: isExpanded ? '#e8f5e8' : '#f8f9fa',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) e.currentTarget.style.backgroundColor = '#e9ecef';
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                        {office.name}
                    </span>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: '#e8f5e8',
                    color: '#388e3c'
                  }}>
                    {officeEmployees.length} {officeEmployees.length === 1 ? 'Employee' : 'Employees'}
                  </span>
                </div>
                
                {isExpanded && (
                  <div style={{ padding: '15px', borderTop: '1px solid #ddd' }}>
                    {officeEmployees.length > 0 ? (
                      officeEmployees.map((emp, index) => (
                        <div key={emp._id} style={{
                          padding: '10px',
                          backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                          borderRadius: '4px',
                          marginBottom: '5px'
                        }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                              {emp.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6c757d' }}>
                              {emp.position} • ID: {emp.employeeId}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ 
                        padding: '20px',
                        textAlign: 'center',
                        color: '#6c757d',
                        fontSize: '14px'
                      }}>
                        No employees assigned to this office
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>

        {/* Recent Documents */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Recent Documents</h3>
        <div>
          {recentDocuments.map((document) => {
            const isExpanded = expandedRecentDocs.has(document._id);
            
            return (
              <div key={document._id} style={{ 
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'white'
              }}>
                <div
                  onClick={() => toggleRecentDoc(document._id)}
                  style={{
                    padding: '15px',
                    backgroundColor: isExpanded ? '#fff3cd' : '#f8f9fa',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) e.currentTarget.style.backgroundColor = '#e9ecef';
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                        {document.name}
                    </span>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: '#fff3cd',
                    color: '#856404'
                  }}>
                    {document.type || 'Document'}
                  </span>
                </div>
                
                {isExpanded && (
                  <div style={{ padding: '15px', borderTop: '1px solid #ddd' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Type</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>{document.type}</div>
                        </div>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Submitted By</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>{document.submittedBy || 'N/A'}</div>
                      </div>
                    <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Date Uploaded</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                          {document.dateUploaded ? new Date(document.dateUploaded).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    {document.description && (
                      <div>
                        <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Description</div>
                        <div style={{ fontSize: '14px', color: '#2c3e50' }}>{document.description}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>
      </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
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
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#2c3e50' }}>
                System Reports
              </h2>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#999',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            <p style={{ color: '#666', marginBottom: '25px', fontSize: '14px' }}>
              Download comprehensive reports of your system data in PDF format
            </p>

            <div style={{ display: 'grid', gap: '15px' }}>
              {/* Full System Report */}
              <div style={{
                padding: '20px',
                border: '2px solid #3498db',
                borderRadius: '8px',
                backgroundColor: '#e3f2fd',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={downloadFullSystemReport}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#2c3e50', fontSize: '16px' }}>Full System Report</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                      Complete overview of all system data
                    </p>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>↓</span>
                </div>
              </div>

              {/* Employees Report */}
              <div style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={downloadEmployeesReport}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3498db';
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.backgroundColor = 'white';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 3px 0', color: '#2c3e50', fontSize: '15px' }}>Employees Report</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                      List of all employees ({employees.length} total)
                    </p>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>↓</span>
                </div>
              </div>

              {/* Offices Report */}
              <div style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={downloadOfficesReport}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#7b1fa2';
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.backgroundColor = 'white';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 3px 0', color: '#2c3e50', fontSize: '15px' }}>Offices Report</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                      List of all offices ({offices.length} total)
                    </p>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>↓</span>
                </div>
              </div>

              {/* Documents Report */}
              <div style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={downloadDocumentsReport}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#388e3c';
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.backgroundColor = 'white';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 3px 0', color: '#2c3e50', fontSize: '15px' }}>Documents Report</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                      List of all documents ({documents.length} total)
                    </p>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>↓</span>
                </div>
              </div>

              {/* Employees by Department Report */}
              <div style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={downloadEmployeesByDepartmentReport}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#f57c00';
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.backgroundColor = 'white';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 3px 0', color: '#2c3e50', fontSize: '15px' }}>Employees by Department</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                      Employee distribution across departments
                    </p>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>↓</span>
                </div>
              </div>

              {/* Documents by Type Report */}
              <div style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={downloadDocumentsByTypeReport}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#d32f2f';
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.backgroundColor = 'white';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 3px 0', color: '#2c3e50', fontSize: '15px' }}>Documents by Type</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                      Document distribution by type
                    </p>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>↓</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  padding: '10px 30px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
