const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Document = require('../models/Document');
const Employee = require('../models/Employee');
const User = require('../models/User');

// Get all notifications for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { limit = 50, unreadOnly = false } = req.query;
    let query = { userId: req.params.userId };
    
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('documentId', 'documentId name status')
      .populate('employeeId', 'name email');
    
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get notifications for an employee (by employeeId)
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { limit = 50, unreadOnly = false } = req.query;
    let query = { employeeId: req.params.employeeId };
    
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('documentId', 'documentId name status')
      .populate('employeeId', 'name email');
    
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching employee notifications:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get unread count for a user
router.get('/user/:userId/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.params.userId, 
      read: false 
    });
    res.json({ count });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get unread count for an employee
router.get('/employee/:employeeId/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      employeeId: req.params.employeeId, 
      read: false 
    });
    res.json({ count });
  } catch (err) {
    console.error('Error fetching employee unread count:', err);
    res.status(500).json({ message: err.message });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    notification.read = true;
    await notification.save();
    
    res.json(notification);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: err.message });
  }
});

// Mark all notifications as read for a user
router.patch('/user/:userId/read-all', async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.params.userId, read: false },
      { $set: { read: true } }
    );
    
    res.json({ 
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount 
    });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ message: err.message });
  }
});

// Mark all notifications as read for an employee
router.patch('/employee/:employeeId/read-all', async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { employeeId: req.params.employeeId, read: false },
      { $set: { read: true } }
    );
    
    res.json({ 
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount 
    });
  } catch (err) {
    console.error('Error marking all employee notifications as read:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    await Notification.deleteOne({ _id: req.params.id });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete all notifications for a user
router.delete('/user/:userId/all', async (req, res) => {
  try {
    const result = await Notification.deleteMany({ userId: req.params.userId });
    res.json({ 
      message: 'All notifications deleted',
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error('Error deleting all notifications:', err);
    res.status(500).json({ message: err.message });
  }
});

// Helper function to create notifications (can be imported by other routes)
const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
};

// Helper function to notify users about document events
const notifyDocumentEvent = async (document, eventType, options = {}) => {
  try {
    const notifications = [];
    
    // Notify the submitter (the user who uploaded/sent the file)
    if (document.submittedBy) {
      // Try to find user by username first
      let user = await User.findOne({ username: document.submittedBy });
      
      // If not found by username, try to find by employee name (submittedBy might be employee name)
      if (!user) {
        const Employee = require('../models/Employee');
        const employee = await Employee.findOne({ name: document.submittedBy });
        if (employee && employee.employeeId) {
          user = await User.findOne({ employeeId: employee.employeeId });
        }
      }
      
      if (user) {
        // Get personalized message for submitter
        const title = getNotificationTitle(eventType, document, true); // true = isSubmitter
        const message = getNotificationMessage(eventType, document, options, true); // true = isSubmitter
        
        // Check if notification already added for this user
        const existingNotification = notifications.find(n => n.userId === user._id.toString());
        if (!existingNotification) {
          notifications.push({
            userId: user._id.toString(),
            type: eventType,
            title,
            message,
            documentId: document._id,
            documentName: document.name,
            metadata: {
              documentId: document.documentId,
              status: document.status,
              isSubmitter: true,
              ...options
            }
          });
          console.log(`✓ Notification created for submitter: ${user.username || user.email} (${document.submittedBy}) - Event: ${eventType}`);
        }
      } else {
        // Log if user not found for debugging
        console.log(`⚠️ User not found for submitter: "${document.submittedBy}". Tried username and employee name lookup.`);
      }
    }
    
    // Notify assigned employees
    if (document.assignedTo && document.assignedTo.length > 0) {
      for (const employeeId of document.assignedTo) {
        const employee = await Employee.findById(employeeId);
        if (employee) {
          // Find user linked to this employee
          const user = await User.findOne({ employeeId: employee.employeeId });
          if (user) {
            const title = getNotificationTitle(eventType, document);
            const message = getNotificationMessage(eventType, document, options);
            
            notifications.push({
              userId: user._id.toString(),
              employeeId: employee._id,
              type: eventType,
              title,
              message,
              documentId: document._id,
              documentName: document.name,
              metadata: {
                documentId: document.documentId,
                status: document.status,
                ...options
              }
            });
          }
        }
      }
    }
    
    // Notify current handler
    if (document.currentHandler) {
      const handler = await Employee.findById(document.currentHandler);
      if (handler) {
        const user = await User.findOne({ employeeId: handler.employeeId });
        if (user) {
          // Check if notification already added for this user
          const existingNotification = notifications.find(n => n.userId === user._id.toString());
          if (!existingNotification) {
            const title = getNotificationTitle(eventType, document);
            const message = getNotificationMessage(eventType, document, options);
            
            notifications.push({
              userId: user._id.toString(),
              employeeId: handler._id,
              type: eventType,
              title,
              message,
              documentId: document._id,
              documentName: document.name,
              metadata: {
                documentId: document.documentId,
                status: document.status,
                ...options
              }
            });
          }
        }
      }
    }
    
    // Create all notifications
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
    
    return notifications;
  } catch (err) {
    console.error('Error creating document notifications:', err);
    throw err;
  }
};

// Helper functions for notification content
const getNotificationTitle = (eventType, document, isSubmitter = false) => {
  const titles = {
    'document_uploaded': isSubmitter ? 'Your Document Uploaded Successfully' : 'New Document Uploaded',
    'document_updated': isSubmitter ? 'Your Document Has Been Updated' : 'Document Updated',
    'document_assigned': 'Document Assigned to You',
    'document_forwarded': isSubmitter ? 'Your Document Has Been Forwarded' : 'Document Forwarded to You',
    'document_approved': isSubmitter ? 'Your Document Has Been Approved!' : 'Document Approved',
    'document_rejected': isSubmitter ? 'Your Document Has Been Rejected' : 'Document Rejected',
    'file_updated': isSubmitter ? 'Your Document File Has Been Updated' : 'File Updated'
  };
  return titles[eventType] || 'Document Notification';
};

const getNotificationMessage = (eventType, document, options = {}, isSubmitter = false) => {
  const documentName = document.name || document.documentId || 'Document';
  
  if (isSubmitter) {
    // Personalized messages for the submitter
    const submitterMessages = {
      'document_uploaded': `Your document "${documentName}" has been uploaded successfully${options.hasFile ? ' with a file attachment' : ''}.`,
      'document_updated': `Your document "${documentName}" has been updated. New status: ${document.status || 'Updated'}.`,
      'document_forwarded': `Your document "${documentName}" has been forwarded to ${options.nextOffice || options.employeeName || 'another office'}${options.forwardedBy ? ` by ${options.forwardedBy}` : ''}.`,
      'document_approved': `Congratulations! Your document "${documentName}" has been approved${options.approvedBy ? ` by ${options.approvedBy}` : ''}.`,
      'document_rejected': `Your document "${documentName}" has been rejected${options.rejectedBy ? ` by ${options.rejectedBy}` : ''}. ${options.comments ? `Reason: ${options.comments}` : 'Please review and resubmit if needed.'}`,
      'file_updated': `The file for your document "${documentName}" has been updated.`
    };
    return submitterMessages[eventType] || `Update regarding your document "${documentName}".`;
  } else {
    // Messages for other users (assigned employees, handlers, etc.)
    const messages = {
      'document_uploaded': `A new document "${documentName}" has been uploaded${options.submittedBy ? ` by ${options.submittedBy}` : ''}.`,
      'document_updated': `The document "${documentName}" has been updated. Status: ${document.status || 'Updated'}.`,
      'document_assigned': `You have been assigned to review the document "${documentName}".`,
      'document_forwarded': `The document "${documentName}" has been forwarded to you${options.forwardedBy ? ` by ${options.forwardedBy}` : ''}.`,
      'document_approved': `The document "${documentName}" has been approved${options.approvedBy ? ` by ${options.approvedBy}` : ''}.`,
      'document_rejected': `The document "${documentName}" has been rejected${options.rejectedBy ? ` by ${options.rejectedBy}` : ''}.`,
      'file_updated': `The file for document "${documentName}" has been updated.`
    };
    return messages[eventType] || `Update regarding document "${documentName}".`;
  }
};

module.exports = router;
module.exports.createNotification = createNotification;
module.exports.notifyDocumentEvent = notifyDocumentEvent;

