import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import DailyActivityReport from './components/DailyActivityReport';
import NotificationSystem from './components/NotificationSystem';
import AnalyticsGraphs from './components/AnalyticsGraphs';
import API_URL from './config';

function Reports() {
  const [employees, setEmployees] = useState([]);
  const [offices, setOffices] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOffices, setExpandedOffices] = useState(new Set());
  const [expandedDepartments, setExpandedDepartments] = useState(new Set());
  const [expandedDelayDepartment, setExpandedDelayDepartment] = useState('');
  const [departmentDelaySearch, setDepartmentDelaySearch] = useState('');
  const [departmentDetailSearch, setDepartmentDetailSearch] = useState({});
  const [expandedDocTypes, setExpandedDocTypes] = useState(new Set());
  const [expandedRecentDocs, setExpandedRecentDocs] = useState(new Set());
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'daily', 'trends', or 'custom'
  
  // Custom report filters
  const [selectedOffice, setSelectedOffice] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedDocTypes, setSelectedDocTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);

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

  const toggleDelayDepartment = (deptName) => {
    setExpandedDelayDepartment((prev) => (prev === deptName ? '' : deptName));
  };

  const updateDepartmentDetailSearch = (deptName, value) => {
    setDepartmentDetailSearch((prev) => ({
      ...prev,
      [deptName]: value
    }));
  };

  const getEmployeesForDepartment = (departmentId) => {
    if (departmentId === 'all') return employees;

    const selectedDepartment = offices.find(o => String(o._id) === String(departmentId));
    if (!selectedDepartment) return [];

    const normalize = (value) => (value || '').toString().trim().toLowerCase();
    const selectedDepartmentName = normalize(selectedDepartment.name);

    return employees.filter((emp) => {
      const employeeOfficeId = emp.office?._id;
      const employeeOfficeName = normalize(emp.office?.name);
      const employeeDepartment = normalize(emp.department);

      return String(employeeOfficeId) === String(selectedDepartment._id) ||
        employeeOfficeName === selectedDepartmentName ||
        employeeDepartment === selectedDepartmentName;
    });
  };

  const handleDepartmentFilterChange = (value) => {
    setSelectedOffice(value);

    if (selectedEmployee === 'all') return;

    const validEmployees = getEmployeesForDepartment(value);
    const isEmployeeInDepartment = validEmployees.some(
      (emp) => String(emp._id) === String(selectedEmployee)
    );

    if (!isEmployeeInDepartment) {
      setSelectedEmployee('all');
    }
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
      const [employeesRes, officesRes, programsRes, documentsRes, docTypesRes] = await Promise.all([
        fetch(`${API_URL}/employees`),
        fetch(`${API_URL}/offices`),
        fetch(`${API_URL}/programs`),
        fetch(`${API_URL}/documents`),
        fetch(`${API_URL}/document-types`)
      ]);

      const employeesData = await employeesRes.json();
      const officesData = await officesRes.json();
      const programsData = await programsRes.json();
      const documentsData = await documentsRes.json();
      const docTypesData = await docTypesRes.json();

      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      setOffices(Array.isArray(officesData) ? officesData : []);
      setPrograms(Array.isArray(programsData) ? programsData : []);
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
      setDocumentTypes(Array.isArray(docTypesData) ? docTypesData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const getEmployeesByOffices = () => {
    const officeGroups = {};
    employees.forEach(emp => {
      const officeName = emp.office?.name || emp.department || 'Unassigned';
      officeGroups[officeName] = (officeGroups[officeName] || 0) + 1;
    });
    return officeGroups;
  };

  const getDocumentsByType = () => {
    const types = {};
    
    // Initialize all document types with 0 count
    if (Array.isArray(documentTypes)) {
      documentTypes.forEach(docType => {
        types[docType.name] = 0;
      });
    }
    
    // Count actual documents
    if (Array.isArray(documents)) {
      documents.forEach(doc => {
        if (types.hasOwnProperty(doc.type)) {
          types[doc.type] += 1;
        } else {
          // If document type not in list, still count it
          types[doc.type] = (types[doc.type] || 0) + 1;
        }
      });
    }
    
    return types;
  };


  const getRecentDocuments = () => {
    if (!Array.isArray(documents)) {
      return [];
    }
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

  const downloadEmployeesByOfficesReport = () => {
    const doc = new jsPDF();
    const employeesByOffices = getEmployeesByOffices();
    
    doc.setFontSize(18);
    doc.text('Employees by Offices', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    
    const tableData = Object.entries(employeesByOffices).map(([office, count]) => [
      office,
      count
    ]);
    
    doc.autoTable({
      head: [['Office', 'Number of Employees']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [245, 124, 0] }
    });
    
    doc.save('Employees_By_Offices_Report.pdf');
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

  // Apply filters to documents
  const applyFilters = () => {
    let filtered = [...documents];

    console.log('🎯 Apply Filters Called');
    console.log('📋 Available offices:', offices.map(o => ({ 
      id: o._id, 
      idType: typeof o._id,
      name: o.name 
    })));
    console.log('🔑 Selected Office ID:', selectedOffice, 'Type:', typeof selectedOffice);

    // Filter by office
    if (selectedOffice !== 'all') {
      // Convert to string for comparison to handle type mismatches
      const office = offices.find(o => String(o._id) === String(selectedOffice));
      console.log('🔍 Found Office:', office);
      
      if (office) {
        const officeEmployees = getEmployeesForDepartment(selectedOffice);
        
        console.log('👥 Employees in this office:', officeEmployees.map(e => ({
          name: e.name,
          office: e.office?.name,
          department: e.department
        })));
        
        if (officeEmployees.length > 0) {
          const officeEmployeeNames = officeEmployees.map(emp => emp.name.toLowerCase());
          console.log('📝 Employee names in office:', officeEmployeeNames);
          
          filtered = filtered.filter(doc => 
            officeEmployeeNames.some(name => 
              doc.submittedBy?.toLowerCase().includes(name) || 
              name.includes(doc.submittedBy?.toLowerCase())
            )
          );
        } else {
          // No employees in this office, so no documents should match
          console.log('⚠️ No employees found in this office - showing no documents');
          filtered = [];
        }
        
        console.log('📄 Filtered documents:', filtered.map(d => ({
          id: d.documentId,
          name: d.name,
          submittedBy: d.submittedBy
        })));
      } else {
        // Office not found - show no documents
        console.log('❌ Office not found - showing no documents');
        filtered = [];
      }
    }

    // Filter by employee
    if (selectedEmployee !== 'all') {
      console.log('🔑 Selected Employee ID:', selectedEmployee, 'Type:', typeof selectedEmployee);
      
      // Convert to string for comparison to handle type mismatches
      const employee = employees.find(emp => String(emp._id) === String(selectedEmployee));
      console.log('👤 Found Employee:', employee);
      
      if (employee) {
        console.log('🔍 Filtering documents by employee:', employee.name);
        
        filtered = filtered.filter(doc => {
          const docSubmitter = doc.submittedBy?.toLowerCase() || '';
          const empName = employee.name.toLowerCase();
          
          // Check if document submitter matches employee name
          const matches = docSubmitter.includes(empName) || empName.includes(docSubmitter);
          
          console.log(`  📄 ${doc.documentId} - "${doc.submittedBy}" matches "${employee.name}"?`, matches);
          
          return matches;
        });
        
        console.log('✅ Final filtered documents:', filtered.map(d => ({
          id: d.documentId,
          name: d.name,
          submittedBy: d.submittedBy
        })));
      } else {
        // Employee not found - show no documents
        console.log('❌ Employee not found - showing no documents');
        filtered = [];
      }
    }

    // Filter by document types
    if (selectedDocTypes.length > 0) {
      filtered = filtered.filter(doc => selectedDocTypes.includes(doc.type));
    }

    // Filter by status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(doc => selectedStatuses.includes(doc.status || 'Processing'));
    }

    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(doc => {
        const docDate = new Date(doc.dateUploaded);
        return docDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(doc => {
        const docDate = new Date(doc.dateUploaded);
        return docDate <= toDate;
      });
    }

    setFilteredDocuments(filtered);
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedOffice('all');
    setSelectedEmployee('all');
    setSelectedDocTypes([]);
    setSelectedStatuses([]);
    setDateFrom('');
    setDateTo('');
    setFilteredDocuments([]);
  };

  // Download custom filtered report
  const downloadCustomReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Custom Filtered Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    
    let yPos = 35;
    
    // Add filter information
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Filter Criteria:', 14, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    if (selectedOffice !== 'all') {
      const office = offices.find(o => o._id === selectedOffice);
      doc.text(`Office: ${office?.name || 'N/A'}`, 14, yPos);
      yPos += 5;
    }
    
    if (selectedEmployee !== 'all') {
      const employee = employees.find(emp => emp._id === selectedEmployee);
      doc.text(`Employee: ${employee?.name || 'N/A'}`, 14, yPos);
      yPos += 5;
    }
    
    if (selectedDocTypes.length > 0) {
      doc.text(`Document Types: ${selectedDocTypes.join(', ')}`, 14, yPos);
      yPos += 5;
    }
    
    if (selectedStatuses.length > 0) {
      doc.text(`Statuses: ${selectedStatuses.join(', ')}`, 14, yPos);
      yPos += 5;
    }
    
    if (dateFrom) {
      doc.text(`Date From: ${new Date(dateFrom).toLocaleDateString()}`, 14, yPos);
      yPos += 5;
    }
    
    if (dateTo) {
      doc.text(`Date To: ${new Date(dateTo).toLocaleDateString()}`, 14, yPos);
      yPos += 5;
    }
    
    yPos += 5;
    
    // Add document table
    const tableData = filteredDocuments.map(d => [
      d.documentId,
      d.name,
      d.type,
      d.status || 'Processing',
      d.submittedBy || 'N/A',
      d.dateUploaded ? new Date(d.dateUploaded).toLocaleDateString() : 'N/A'
    ]);
    
    doc.autoTable({
      head: [['ID', 'Name', 'Type', 'Status', 'Submitted By', 'Date']],
      body: tableData,
      startY: yPos,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      styles: { fontSize: 8 }
    });
    
    doc.save('Custom_Filtered_Report.pdf');
  };

  // Handle document type checkbox
  const handleDocTypeChange = (type) => {
    setSelectedDocTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Handle status checkbox
  const handleStatusChange = (status) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const downloadFullSystemReport = () => {
    const doc = new jsPDF();
    const employeesByOffices = getEmployeesByOffices();
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
    
    // Employees by Offices
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Employees by Offices', 14, yPos);
    yPos += 8;
    
    doc.autoTable({
      head: [['Office', 'Count']],
      body: Object.entries(employeesByOffices).map(([office, count]) => [office, count]),
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

  const employeesByOffices = getEmployeesByOffices();
  const documentsByType = getDocumentsByType();
  const recentDocuments = getRecentDocuments();
  const availableEmployeesForSelectedDepartment = getEmployeesForDepartment(selectedOffice);

  return (
    <div style={{ fontSize: '16px', lineHeight: 1.5, maxWidth: '100%' }}>
      {/* Header with Report Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(26px, 2.5vw, 34px)', fontWeight: '700', color: '#2c3e50' }}>Dashboard</h1>
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
            fontSize: '15px',
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
            fontSize: '15px',
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
            fontSize: '15px',
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
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderRadius: '6px 6px 0 0',
            whiteSpace: 'nowrap'
          }}
        >
          Department Delays
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'custom' ? '#3498db' : 'transparent',
            color: activeTab === 'custom' ? 'white' : '#2c3e50',
            border: 'none',
            borderBottom: activeTab === 'custom' ? '3px solid #2980b9' : '3px solid transparent',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderRadius: '6px 6px 0 0',
            whiteSpace: 'nowrap'
          }}
        >
          Custom Report
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'analytics' ? '#3498db' : 'transparent',
            color: activeTab === 'analytics' ? 'white' : '#2c3e50',
            border: 'none',
            borderBottom: activeTab === 'analytics' ? '3px solid #2980b9' : '3px solid transparent',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderRadius: '6px 6px 0 0',
            whiteSpace: 'nowrap'
          }}
        >
          Analytics & Graphs
        </button>
      </div>

      {/* Conditional Rendering based on Active Tab */}
      {activeTab === 'daily' ? (
        <DailyActivityReport />
      ) : activeTab === 'analytics' ? (
        <AnalyticsGraphs 
          documents={documents}
          employees={employees}
          offices={offices}
          documentTypes={documentTypes}
        />
      ) : activeTab === 'custom' ? (
        <div>
          <h2 style={{
            margin: '0 0 20px 0',
            fontSize: '24px',
            fontWeight: '600',
            color: '#2c3e50'
          }}>
            Custom Report Generator
          </h2>

          {/* Filters Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '25px',
            marginBottom: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Filter Criteria
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              {/* Department Filter */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '15px', 
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Department
                </label>
                <select
                  value={selectedOffice}
                  onChange={(e) => handleDepartmentFilterChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '15px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="all">All Departments</option>
                  {offices.map(office => (
                    <option key={office._id} value={office._id}>{office.name}</option>
                  ))}
                </select>
              </div>

              {/* Employee Filter */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '15px', 
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Employee
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '15px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="all">All Employees</option>
                  {availableEmployeesForSelectedDepartment.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '15px', 
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '15px',
                    backgroundColor: 'white'
                  }}
                />
              </div>

              {/* Date To */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '15px', 
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '15px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
            </div>

            {/* Document Types Filter */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '15px', 
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                Document Types
              </label>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '10px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px'
              }}>
                {documentTypes.map(docType => (
                  <label key={docType._id} style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    backgroundColor: selectedDocTypes.includes(docType.name) ? '#e3f2fd' : 'white',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: selectedDocTypes.includes(docType.name) ? '#3498db' : '#ddd',
                    fontSize: '13px',
                    transition: 'all 0.2s ease'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedDocTypes.includes(docType.name)}
                      onChange={() => handleDocTypeChange(docType.name)}
                      style={{ cursor: 'pointer' }}
                    />
                    {docType.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '15px', 
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                Document Status
              </label>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '10px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px'
              }}>
                {['Processing', 'Approved', 'Rejected', 'Under Review', 'On Hold', 'Completed'].map(status => (
                  <label key={status} style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    backgroundColor: selectedStatuses.includes(status) ? '#e3f2fd' : 'white',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: selectedStatuses.includes(status) ? '#3498db' : '#ddd',
                    fontSize: '13px',
                    transition: 'all 0.2s ease'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={() => handleStatusChange(status)}
                      style={{ cursor: 'pointer' }}
                    />
                    {status}
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={applyFilters}
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
              >
                Apply Filters
              </button>
              <button
                onClick={resetFilters}
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#7f8c8d'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#95a5a6'}
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Results Section */}
          {filteredDocuments.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '25px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  margin: '0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  Filtered Results ({filteredDocuments.length} documents)
                </h3>
                <button
                  onClick={downloadCustomReport}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#229954'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#27ae60'}
                >
                  Download PDF Report
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                        Document ID
                      </th>
                      <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                        Name
                      </th>
                      <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                        Type
                      </th>
                      <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                        Status
                      </th>
                      <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                        Submitted By
                      </th>
                      <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>
                        Date Uploaded
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc, index) => (
                      <tr key={doc._id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                        <td style={{ border: '1px solid #ddd', padding: '10px', fontSize: '13px', color: '#2c3e50' }}>
                          <code style={{
                            backgroundColor: '#e9ecef',
                            padding: '3px 6px',
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {doc.documentId}
                          </code>
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '10px', fontSize: '13px', fontWeight: '500', color: '#2c3e50' }}>
                          {doc.name}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '10px', fontSize: '13px', color: '#2c3e50' }}>
                          <span style={{
                            backgroundColor: '#e8f5e8',
                            color: '#388e3c',
                            padding: '3px 8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {doc.type || 'N/A'}
                          </span>
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '10px', fontSize: '13px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: (() => {
                              const status = doc.status || 'Processing';
                              const colors = {
                                'Approved': '#28a745',
                                'Processing': '#17a2b8',
                                'Under Review': '#ffc107',
                                'Rejected': '#dc3545',
                                'On Hold': '#6c757d',
                                'Completed': '#28a745'
                              };
                              return colors[status] || '#6c757d';
                            })(),
                            color: 'white'
                          }}>
                            {doc.status || 'Processing'}
                          </span>
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '10px', fontSize: '13px', color: '#6c757d' }}>
                          {doc.submittedBy || 'N/A'}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '10px', fontSize: '13px', color: '#6c757d' }}>
                          {doc.dateUploaded ? new Date(doc.dateUploaded).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredDocuments.length === 0 && (selectedOffice !== 'all' || selectedEmployee !== 'all' || selectedDocTypes.length > 0 || selectedStatuses.length > 0 || dateFrom || dateTo) && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '40px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '16px', color: '#6c757d', margin: 0 }}>
                No documents match the selected filters. Try adjusting your criteria.
              </p>
            </div>
          )}
        </div>
      ) : activeTab === 'delays' ? (
        <div>
          {(() => {
            const normalizeText = (value) => (value || '').toString().trim().toLowerCase();
            const normalizeDisplay = (value) => (value || '').toString().trim();

            const officeDirectory = (Array.isArray(offices) ? offices : [])
              .map((office) => ({
                name: normalizeDisplay(office?.name),
                department: normalizeDisplay(office?.department)
              }))
              .filter((office) => office.name);

            const resolveOfficeName = (value) => {
              const normalizedValue = normalizeText(value);
              if (!normalizedValue) return null;

              const exactOffice = officeDirectory.find(
                (office) => normalizeText(office.name) === normalizedValue
              );
              if (exactOffice) return exactOffice.name;

              const departmentMatch = officeDirectory.find(
                (office) => normalizeText(office.department) === normalizedValue
              );
              if (departmentMatch) return departmentMatch.name;

              return null;
            };

            // Helper function to get submitter's department
            const getSubmitterDepartment = (submittedBy) => {
              const normalizedSubmittedBy = normalizeText(submittedBy);
              if (!normalizedSubmittedBy) return null;

              const exactSubmitter = employees.find((emp) =>
                normalizeText(emp.name) === normalizedSubmittedBy ||
                normalizeText(emp.employeeId) === normalizedSubmittedBy
              );

              const fuzzySubmitter = exactSubmitter || employees.find((emp) => {
                const employeeName = normalizeText(emp.name);
                return employeeName && (
                  normalizedSubmittedBy.includes(employeeName) ||
                  employeeName.includes(normalizedSubmittedBy)
                );
              });

              if (!fuzzySubmitter) return null;

              const directOffice = resolveOfficeName(fuzzySubmitter.office?.name);
              if (directOffice) return directOffice;

              const mappedDepartment = resolveOfficeName(fuzzySubmitter.department);
              if (mappedDepartment) return mappedDepartment;

              return null;
            };

            // Build department cards from official offices only (matches Office Management count)
            const knownDepartments = new Set(officeDirectory.map((office) => office.name));

            // Group documents by department
            const documentsByDepartment = {};

            knownDepartments.forEach((deptName) => {
              documentsByDepartment[deptName] = [];
            });

            if (Array.isArray(documents)) {
              documents.forEach((doc) => {
                const dept = getSubmitterDepartment(doc.submittedBy);
                if (dept && documentsByDepartment[dept]) {
                  documentsByDepartment[dept].push(doc);
                }
              });
            }

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
            const filteredDepartmentStats = departmentStats.filter((deptStat) =>
              deptStat.department.toLowerCase().includes(departmentDelaySearch.toLowerCase().trim())
            );

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

                {departmentStats.length > 0 && (
                  <>
                    <div style={{
                      marginBottom: '16px',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1px solid #dbe4f0',
                      background: 'linear-gradient(135deg, #f7faff 0%, #eef4ff 100%)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '14px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>Departments</span>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#1d4ed8',
                          backgroundColor: '#dbeafe',
                          borderRadius: '999px',
                          padding: '3px 10px'
                        }}>
                          {filteredDepartmentStats.length} shown
                        </span>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#64748b',
                          backgroundColor: '#f1f5f9',
                          borderRadius: '999px',
                          padding: '3px 10px'
                        }}>
                          {departmentStats.length} total
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="Search department..."
                        value={departmentDelaySearch}
                        onChange={(e) => setDepartmentDelaySearch(e.target.value)}
                        style={{
                          minWidth: '240px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: 'white',
                          color: '#1e293b'
                        }}
                      />
                    </div>

                    {/* Square Department Cards */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                      gap: '14px',
                      marginBottom: '20px'
                    }}>
                      {filteredDepartmentStats.map((deptStat) => {
                        const isExpanded = expandedDelayDepartment === deptStat.department;

                        return (
                          <React.Fragment key={deptStat.department}>
                            <div
                              onClick={() => toggleDelayDepartment(deptStat.department)}
                              style={{
                                aspectRatio: '1 / 1',
                                minHeight: '150px',
                                borderRadius: '14px',
                                border: isExpanded ? '2px solid #2563eb' : '1px solid #dbe4f0',
                                background: isExpanded
                                  ? 'linear-gradient(155deg, #eaf2ff 0%, #ffffff 70%)'
                                  : 'linear-gradient(155deg, #ffffff 0%, #f7faff 100%)',
                                boxShadow: isExpanded
                                  ? '0 12px 24px rgba(37,99,235,0.18)'
                                  : '0 4px 12px rgba(15,23,42,0.08)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                padding: '14px',
                                position: 'relative',
                                overflow: 'hidden',
                                transform: isExpanded ? 'translateY(-2px)' : 'translateY(0)',
                                transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1), background 260ms ease, border-color 260ms ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!isExpanded) {
                                  e.currentTarget.style.background = 'linear-gradient(155deg, #ffffff 0%, #edf4ff 100%)';
                                  e.currentTarget.style.transform = 'translateY(-4px)';
                                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(30,64,175,0.14)';
                                  e.currentTarget.style.borderColor = '#bfdbfe';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isExpanded) {
                                  e.currentTarget.style.background = 'linear-gradient(155deg, #ffffff 0%, #f7faff 100%)';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.08)';
                                  e.currentTarget.style.borderColor = '#dbe4f0';
                                }
                              }}
                            >
                              <div style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                height: '4px',
                                background: isExpanded
                                  ? 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)'
                                  : 'linear-gradient(90deg, #dbeafe 0%, #e2e8f0 100%)'
                              }} />
                              <div style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                letterSpacing: '0.4px',
                                textTransform: 'uppercase',
                                color: '#1d4ed8',
                                backgroundColor: '#e0ebff',
                                borderRadius: '999px',
                                padding: '4px 10px',
                                marginBottom: '10px'
                              }}>
                                Department
                              </div>
                              <div style={{
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#2c3e50',
                                marginBottom: '10px',
                                lineHeight: '1.25',
                                letterSpacing: '0.2px'
                              }}>
                                {deptStat.department}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: deptStat.delayed > 0 ? '#d32f2f' : '#388e3c'
                              }}>
                                {deptStat.delayed} delayed / {deptStat.total} total
                              </div>
                            </div>

                          </React.Fragment>
                        );
                      })}
                    </div>

                    {filteredDepartmentStats.length === 0 && (
                      <div style={{
                        padding: '20px',
                        marginBottom: '16px',
                        textAlign: 'center',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '10px',
                        color: '#64748b',
                        fontSize: '14px',
                        backgroundColor: '#f8fafc'
                      }}>
                        No department matched your search.
                      </div>
                    )}

                    {/* Expanded Department Details */}
                    {filteredDepartmentStats
                      .filter((deptStat) => expandedDelayDepartment === deptStat.department)
                      .map((deptStat) => {
                        const detailSearchValue = departmentDetailSearch[deptStat.department] || '';
                        const normalizedDetailSearch = detailSearchValue.toLowerCase().trim();
                        const normalizedDepartmentName = normalizeText(deptStat.department);
                        const departmentEmployees = employees
                          .filter((emp) => {
                            const employeeOfficeName = normalizeText(emp.office?.name);
                            const employeeDepartmentName = normalizeText(emp.department);
                            return employeeOfficeName === normalizedDepartmentName ||
                              employeeDepartmentName === normalizedDepartmentName;
                          })
                          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                        const visibleDocuments = deptStat.documents.filter((doc) => {
                          if (!normalizedDetailSearch) return true;
                          const searchableText = [
                            doc.documentId,
                            doc.name,
                            doc.type,
                            doc.status,
                            doc.submittedBy
                          ]
                            .filter(Boolean)
                            .join(' ')
                            .toLowerCase();
                          return searchableText.includes(normalizedDetailSearch);
                        });

                        return (
                        <div key={`${deptStat.department}-details`} style={{
                          backgroundColor: 'white',
                          borderRadius: '10px',
                          marginBottom: '16px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          border: '1px solid #e7ecf3',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '14px 18px',
                            borderBottom: '2px solid #e0e0e0',
                            backgroundColor: '#f6faff'
                          }}>
                            <h3 style={{
                              margin: 0,
                              fontSize: '18px',
                              fontWeight: '600',
                              color: '#2c3e50'
                            }}>
                              {deptStat.department} Details
                            </h3>
                            <span style={{
                              fontSize: '12px',
                              color: '#6c757d',
                              fontWeight: '600'
                            }}>
                              Total: {deptStat.total} | Delayed: {deptStat.delayed} | Completed: {deptStat.completed} | Rejected: {deptStat.rejected}
                            </span>
                          </div>

                          <div style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #e2e8f0',
                            backgroundColor: '#f8fbff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                            flexWrap: 'wrap'
                          }}>
                            <input
                              type="text"
                              placeholder={`Search ${deptStat.department} details...`}
                              value={detailSearchValue}
                              onChange={(e) => updateDepartmentDetailSearch(deptStat.department, e.target.value)}
                              style={{
                                minWidth: '260px',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13px',
                                outline: 'none',
                                backgroundColor: 'white',
                                color: '#1e293b'
                              }}
                            />
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#475569'
                            }}>
                              Showing {visibleDocuments.length} of {deptStat.documents.length}
                            </span>
                          </div>

                          <div style={{
                            padding: '14px 16px',
                            borderBottom: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff'
                          }}>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#334155',
                              marginBottom: '10px'
                            }}>
                              Employees in {deptStat.department} ({departmentEmployees.length})
                            </div>
                            {departmentEmployees.length > 0 ? (
                              <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px'
                              }}>
                                {departmentEmployees.map((employee) => (
                                  <span
                                    key={employee._id || `${employee.employeeId}-${employee.name}`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '6px 10px',
                                      borderRadius: '999px',
                                      border: '1px solid #dbeafe',
                                      backgroundColor: '#eff6ff',
                                      color: '#1e3a8a',
                                      fontSize: '12px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    <span>{employee.name || 'Unnamed'}</span>
                                    <span style={{ color: '#475569', fontWeight: '500' }}>
                                      ({employee.employeeId || 'No ID'})
                                    </span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div style={{
                                fontSize: '13px',
                                color: '#64748b'
                              }}>
                                No employees assigned to this department.
                              </div>
                            )}
                          </div>

                          {visibleDocuments.length > 0 ? (
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
                            {visibleDocuments.map((doc) => (
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
                              No documents matched this details search.
                            </div>
                          )}
                        </div>
                      )})}
                  </>
                )}

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
        
        <div style={{ backgroundColor: '#fff3e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>Total Programs</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: 0, color: '#f57c00' }}>{programs.length}</p>
        </div>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        {/* Employees by Offices */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Employees by Offices</h3>
          <div>
            {Object.entries(employeesByOffices).map(([officeName, count]) => {
              const isExpanded = expandedDepartments.has(officeName);
              const officeEmployees = employees.filter(emp => (emp.office?.name || emp.department) === officeName);
              
              return (
                <div key={officeName} style={{ 
                  marginBottom: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: 'white'
                }}>
                  <div
                    onClick={() => toggleDepartment(officeName)}
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
                        {officeName}
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
                      {officeEmployees.map((emp, index) => (
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
          {recentDocuments.map((document, index) => {
            const isExpanded = expandedRecentDocs.has(document._id);
            
            return (
              <div key={document._id || document.id || document.documentId || `doc-${index}`} style={{ 
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

              {/* Employees by Offices Report */}
              <div style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={downloadEmployeesByOfficesReport}
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
                    <h4 style={{ margin: '0 0 3px 0', color: '#2c3e50', fontSize: '15px' }}>Employees by Offices</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                      Employee distribution across offices
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
                  fontSize: '15px',
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
