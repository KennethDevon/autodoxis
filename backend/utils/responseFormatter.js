/**
 * Response Formatter Utility
 * Converts MySQL/Sequelize responses to MongoDB-like format for frontend compatibility
 * Maps 'id' to '_id' and handles nested objects
 */

function formatResponse(data) {
  if (!data) return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => formatItem(item));
  }
  
  // Handle single objects
  return formatItem(data);
}

function formatItem(item) {
  if (!item || typeof item !== 'object') return item;
  
  // Convert Sequelize instance to plain object if needed
  const plainItem = item.dataValues || item;
  
  // Create new object with _id mapped from id
  const formatted = { ...plainItem };
  
  // Map id to _id for MongoDB compatibility
  if (formatted.id !== undefined && formatted._id === undefined) {
    formatted._id = formatted.id;
  }
  
  // Handle nested objects (like office, currentHandler, etc.)
  if (formatted.office) {
    formatted.office = formatItem(formatted.office);
  }
  
  if (formatted.program) {
    formatted.program = formatItem(formatted.program);
  }
  
  if (formatted.currentHandler) {
    formatted.currentHandler = formatItem(formatted.currentHandler);
  }
  
  if (formatted.employee) {
    formatted.employee = formatItem(formatted.employee);
  }
  
  if (formatted.document) {
    formatted.document = formatItem(formatted.document);
  }
  
  if (formatted.user) {
    formatted.user = formatItem(formatted.user);
  }
  
  // Handle arrays of nested objects (like employees in office)
  if (Array.isArray(formatted.employees)) {
    formatted.employees = formatted.employees.map(emp => formatItem(emp));
  }
  
  if (Array.isArray(formatted.programs)) {
    formatted.programs = formatted.programs.map(prog => formatItem(prog));
  }
  
  if (Array.isArray(formatted.assignedTo)) {
    formatted.assignedTo = formatted.assignedTo.map(emp => formatItem(emp));
  }
  
  // Handle officeEmployees (from junction table)
  if (Array.isArray(formatted.officeEmployees)) {
    formatted.officeEmployees = formatted.officeEmployees.map(emp => formatItem(emp));
  }
  
  return formatted;
}

module.exports = {
  formatResponse,
  formatItem
};

