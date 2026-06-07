import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function AnalyticsGraphs({ documents, employees, offices, documentTypes }) {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [timeView, setTimeView] = useState('months'); // 'months' or 'days'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'line'

  // Use office records as department options for consistent filtering
  const departmentOptions = offices
    .filter((office) => office && office._id)
    .map((office) => ({
      id: String(office._id),
      name: office.name || office.department || 'Unknown Department',
      department: office.department || ''
    }));

  // Helper function to get employee by submittedBy text
  const getDocumentEmployee = (submittedBy) => {
    if (!submittedBy) return null;
    return employees.find(emp =>
      emp.name?.toLowerCase() === submittedBy.toLowerCase() ||
      emp.name?.toLowerCase().includes(submittedBy.toLowerCase()) ||
      submittedBy.toLowerCase().includes(emp.name?.toLowerCase())
    );
  };

  // Filter documents by department
  const getFilteredDocuments = () => {
    if (selectedDepartment === 'all') return documents;
    const selectedOffice = offices.find((office) => String(office._id) === String(selectedDepartment));
    if (!selectedOffice) return [];

    const normalize = (value) => (value || '').toString().trim().toLowerCase();
    const selectedDepartmentNames = new Set([
      normalize(selectedOffice.name),
      normalize(selectedOffice.department)
    ].filter(Boolean));

    return documents.filter(doc => {
      const employee = getDocumentEmployee(doc.submittedBy);
      if (!employee) return false;

      if (String(employee.office?._id) === String(selectedOffice._id)) return true;

      return selectedDepartmentNames.has(normalize(employee.office?.name)) ||
        selectedDepartmentNames.has(normalize(employee.office?.department)) ||
        selectedDepartmentNames.has(normalize(employee.department));
    });
  };

  // Generate data for months view
  const getMonthlyData = () => {
    const filteredDocs = getFilteredDocuments();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCounts = new Array(12).fill(0);

    filteredDocs.forEach(doc => {
      if (doc.dateUploaded) {
        const docDate = new Date(doc.dateUploaded);
        if (docDate.getFullYear() === selectedYear) {
          monthlyCounts[docDate.getMonth()]++;
        }
      }
    });

    return {
      labels: monthNames,
      datasets: [
        {
          label: 'Documents Uploaded',
          data: monthlyCounts,
          backgroundColor: 'rgba(52, 152, 219, 0.6)',
          borderColor: 'rgba(52, 152, 219, 1)',
          borderWidth: 2,
          tension: 0.4
        }
      ]
    };
  };

  // Generate data for days view (current selected month)
  const getDailyData = () => {
    const filteredDocs = getFilteredDocuments();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const dailyCounts = new Array(daysInMonth).fill(0);

    filteredDocs.forEach(doc => {
      if (doc.dateUploaded) {
        const docDate = new Date(doc.dateUploaded);
        if (docDate.getFullYear() === selectedYear && docDate.getMonth() === selectedMonth) {
          dailyCounts[docDate.getDate() - 1]++;
        }
      }
    });

    const labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());

    return {
      labels,
      datasets: [
        {
          label: 'Documents Uploaded',
          data: dailyCounts,
          backgroundColor: 'rgba(46, 204, 113, 0.6)',
          borderColor: 'rgba(46, 204, 113, 1)',
          borderWidth: 2,
          tension: 0.4
        }
      ]
    };
  };

  // Get document status distribution
  const getStatusDistribution = () => {
    const filteredDocs = getFilteredDocuments();
    const statusCounts = {};
    
    filteredDocs.forEach(doc => {
      const status = doc.status || 'Processing';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statuses = Object.keys(statusCounts);
    const counts = Object.values(statusCounts);

    return {
      labels: statuses,
      datasets: [
        {
          label: 'Documents by Status',
          data: counts,
          backgroundColor: [
            'rgba(52, 152, 219, 0.6)',
            'rgba(46, 204, 113, 0.6)',
            'rgba(231, 76, 60, 0.6)',
            'rgba(241, 196, 15, 0.6)',
            'rgba(155, 89, 182, 0.6)',
            'rgba(52, 73, 94, 0.6)'
          ],
          borderColor: [
            'rgba(52, 152, 219, 1)',
            'rgba(46, 204, 113, 1)',
            'rgba(231, 76, 60, 1)',
            'rgba(241, 196, 15, 1)',
            'rgba(155, 89, 182, 1)',
            'rgba(52, 73, 94, 1)'
          ],
          borderWidth: 2
        }
      ]
    };
  };

  // Get document type distribution
  const getTypeDistribution = () => {
    const filteredDocs = getFilteredDocuments();
    const typeCounts = {};
    
    filteredDocs.forEach(doc => {
      const type = doc.type || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const types = Object.keys(typeCounts);
    const counts = Object.values(typeCounts);

    return {
      labels: types,
      datasets: [
        {
          label: 'Documents by Type',
          data: counts,
          backgroundColor: 'rgba(155, 89, 182, 0.6)',
          borderColor: 'rgba(155, 89, 182, 1)',
          borderWidth: 2
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      title: {
        display: true,
        text: timeView === 'months' 
          ? `Document Trends - ${selectedYear}` 
          : `Document Trends - ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} ${selectedYear}`,
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      title: {
        display: true,
        text: 'Distribution',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    }
  };

  const chartData = timeView === 'months' ? getMonthlyData() : getDailyData();
  const ChartComponent = chartType === 'bar' ? Bar : Line;

  return (
    <div>
      <h2 style={{
        margin: '0 0 20px 0',
        fontSize: '24px',
        fontWeight: '600',
        color: '#2c3e50'
      }}>
        Analytics & Trends
      </h2>

      {/* Controls Section */}
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
          Filter Options
        </h3>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginBottom: '20px'
        }}>
          {/* Department Filter */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="all">All Departments</option>
              {departmentOptions.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Time View */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              View By
            </label>
            <select
              value={timeView}
              onChange={(e) => setTimeView(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="months">Months</option>
              <option value="days">Days</option>
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Month Selector (only for days view) */}
          {timeView === 'days' && (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            </div>
          )}

          {/* Chart Type */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Chart Type
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
              {getFilteredDocuments().length}
            </div>
            <div style={{ fontSize: '13px', color: '#6c757d' }}>Total Documents</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
              {getFilteredDocuments().filter(d => d.status === 'Approved').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6c757d' }}>Approved</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>
              {getFilteredDocuments().filter(d => !d.status || d.status === 'Processing').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6c757d' }}>Processing</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
              {getFilteredDocuments().filter(d => d.status === 'Rejected').length}
            </div>
            <div style={{ fontSize: '13px', color: '#6c757d' }}>Rejected</div>
          </div>
        </div>
      </div>

      {/* Main Trend Chart */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '25px',
        marginBottom: '25px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        height: '450px'
      }}>
        <ChartComponent data={chartData} options={chartOptions} />
      </div>

      {/* Additional Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '25px'
      }}>
        {/* Status Distribution */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '25px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          height: '400px'
        }}>
          <Pie data={getStatusDistribution()} options={{
            ...pieOptions,
            plugins: {
              ...pieOptions.plugins,
              title: {
                ...pieOptions.plugins.title,
                text: 'Documents by Status'
              }
            }
          }} />
        </div>

        {/* Type Distribution */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '25px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          height: '400px'
        }}>
          <Bar data={getTypeDistribution()} options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
              title: {
                ...chartOptions.plugins.title,
                text: 'Documents by Type'
              }
            }
          }} />
        </div>
      </div>
    </div>
  );
}

export default AnalyticsGraphs;

