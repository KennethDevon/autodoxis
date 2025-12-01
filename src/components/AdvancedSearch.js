import React, { useState } from 'react';
import API_URL from '../config';

function AdvancedSearch({ onSearch, onClose }) {
  const [searchCriteria, setSearchCriteria] = useState({
    documentId: '',
    name: '',
    type: '',
    status: '',
    submittedBy: '',
    currentOffice: '',
    priority: '',
    department: '',
    category: '',
    dateFrom: '',
    dateTo: ''
  });

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchCriteria(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      // Filter out empty criteria
      const filteredCriteria = Object.entries(searchCriteria).reduce((acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
      }, {});

      const response = await fetch(`${API_URL}/documents/search/advanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filteredCriteria),
      });

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowResults(true);
        if (onSearch) {
          onSearch(results);
        }
      } else {
        alert('Search failed');
      }
    } catch (error) {
      console.error('Error during search:', error);
      alert('Error performing search');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setSearchCriteria({
      documentId: '',
      name: '',
      type: '',
      status: '',
      submittedBy: '',
      currentOffice: '',
      priority: '',
      department: '',
      category: '',
      dateFrom: '',
      dateTo: ''
    });
    setSearchResults([]);
    setShowResults(false);
  };

  return (
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
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '30px',
        width: '90%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px',
          borderBottom: '2px solid #f1f3f4',
          paddingBottom: '15px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '600',
            color: '#2c3e50'
          }}>
            🔍 Advanced Document Search
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#95a5a6',
              padding: '5px 10px',
              borderRadius: '50%',
              transition: 'all 0.3s ease'
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
        </div>

        {/* Search Form */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '25px'
        }}>
          {/* Document ID */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Document ID
            </label>
            <input
              type="text"
              name="documentId"
              value={searchCriteria.documentId}
              onChange={handleInputChange}
              placeholder="Search by ID..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
            />
          </div>

          {/* Document Name */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Document Name
            </label>
            <input
              type="text"
              name="name"
              value={searchCriteria.name}
              onChange={handleInputChange}
              placeholder="Search by name..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
            />
          </div>

          {/* Document Type */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Document Type
            </label>
            <input
              type="text"
              name="type"
              value={searchCriteria.type}
              onChange={handleInputChange}
              placeholder="e.g., Faculty Loading, Travel Order"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
            />
          </div>

          {/* Status */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Status
            </label>
            <select
              name="status"
              value={searchCriteria.status}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Processing">Processing</option>
              <option value="On Hold">On Hold</option>
              <option value="Returned">Returned</option>
            </select>
          </div>

          {/* Submitted By */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Submitted By
            </label>
            <input
              type="text"
              name="submittedBy"
              value={searchCriteria.submittedBy}
              onChange={handleInputChange}
              placeholder="Search by submitter..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
            />
          </div>

          {/* Current Office */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Current Office
            </label>
            <input
              type="text"
              name="currentOffice"
              value={searchCriteria.currentOffice}
              onChange={handleInputChange}
              placeholder="Search by office..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
            />
          </div>

          {/* Priority */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Priority
            </label>
            <select
              name="priority"
              value={searchCriteria.priority}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* Department */}
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
            <input
              type="text"
              name="department"
              value={searchCriteria.department}
              onChange={handleInputChange}
              placeholder="e.g., FCDSET, FNAHS"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
            />
          </div>

          {/* Date From */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Date From
            </label>
            <input
              type="date"
              name="dateFrom"
              value={searchCriteria.dateFrom}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
            />
          </div>

          {/* Date To */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Date To
            </label>
            <input
              type="date"
              name="dateTo"
              value={searchCriteria.dateTo}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e1e8ed',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'flex-end',
          marginBottom: '25px',
          borderTop: '2px solid #f1f3f4',
          paddingTop: '20px'
        }}>
          <button
            onClick={handleClear}
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
            Clear All
          </button>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            style={{
              padding: '12px 24px',
              backgroundColor: isSearching ? '#95a5a6' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isSearching ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!isSearching) {
                e.target.style.backgroundColor = '#2980b9';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSearching) {
                e.target.style.backgroundColor = '#3498db';
              }
            }}
          >
            {isSearching ? 'Searching...' : '🔍 Search'}
          </button>
        </div>

        {/* Search Results */}
        {showResults && (
          <div style={{
            marginTop: '25px',
            borderTop: '2px solid #f1f3f4',
            paddingTop: '25px'
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Search Results ({searchResults.length} found)
            </h3>
            
            {searchResults.length > 0 ? (
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
                        color: '#2c3e50'
                      }}>
                        Document ID
                      </th>
                      <th style={{
                        border: '1px solid #ddd',
                        padding: '12px 10px',
                        textAlign: 'left',
                        backgroundColor: '#f8f9fa',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#2c3e50'
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
                        color: '#2c3e50'
                      }}>
                        Type
                      </th>
                      <th style={{
                        border: '1px solid #ddd',
                        padding: '12px 10px',
                        textAlign: 'left',
                        backgroundColor: '#f8f9fa',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#2c3e50'
                      }}>
                        Status
                      </th>
                      <th style={{
                        border: '1px solid #ddd',
                        padding: '12px 10px',
                        textAlign: 'left',
                        backgroundColor: '#f8f9fa',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#2c3e50'
                      }}>
                        Current Office
                      </th>
                      <th style={{
                        border: '1px solid #ddd',
                        padding: '12px 10px',
                        textAlign: 'left',
                        backgroundColor: '#f8f9fa',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#2c3e50'
                      }}>
                        Priority
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((doc) => (
                      <tr key={doc._id}>
                        <td style={{
                          border: '1px solid #ddd',
                          padding: '12px 10px',
                          fontSize: '13px',
                          color: '#2c3e50',
                          fontFamily: 'monospace'
                        }}>
                          {doc.documentId}
                        </td>
                        <td style={{
                          border: '1px solid #ddd',
                          padding: '12px 10px',
                          fontSize: '14px',
                          color: '#2c3e50'
                        }}>
                          {doc.name}
                        </td>
                        <td style={{
                          border: '1px solid #ddd',
                          padding: '12px 10px',
                          fontSize: '13px',
                          color: '#2c3e50'
                        }}>
                          {doc.type}
                        </td>
                        <td style={{
                          border: '1px solid #ddd',
                          padding: '12px 10px'
                        }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: 
                              doc.status === 'Approved' ? '#e8f5e8' :
                              doc.status === 'Rejected' ? '#ffe8e8' :
                              doc.status === 'On Hold' ? '#fff3cd' :
                              doc.status === 'Processing' ? '#e3f2fd' :
                              '#f8f9fa',
                            color:
                              doc.status === 'Approved' ? '#388e3c' :
                              doc.status === 'Rejected' ? '#d32f2f' :
                              doc.status === 'On Hold' ? '#f39c12' :
                              doc.status === 'Processing' ? '#1976d2' :
                              '#7f8c8d'
                          }}>
                            {doc.status}
                          </span>
                        </td>
                        <td style={{
                          border: '1px solid #ddd',
                          padding: '12px 10px',
                          fontSize: '13px',
                          color: '#2c3e50'
                        }}>
                          {doc.currentOffice || 'N/A'}
                        </td>
                        <td style={{
                          border: '1px solid #ddd',
                          padding: '12px 10px'
                        }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor:
                              doc.priority === 'Urgent' ? '#ffe8e8' :
                              doc.priority === 'High' ? '#fff3cd' :
                              doc.priority === 'Normal' ? '#e3f2fd' :
                              '#f8f9fa',
                            color:
                              doc.priority === 'Urgent' ? '#d32f2f' :
                              doc.priority === 'High' ? '#f39c12' :
                              doc.priority === 'Normal' ? '#1976d2' :
                              '#7f8c8d'
                          }}>
                            {doc.priority || 'Normal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{
                textAlign: 'center',
                color: '#95a5a6',
                fontSize: '16px',
                padding: '40px'
              }}>
                No documents found matching your search criteria.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdvancedSearch;

