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
// Notifies: 1) Document owner (with personalized messages), 2) All other users (with different messages)
const notifyDocumentEvent = async (document, eventType, options = {}) => {
  try {
    const notifications = [];
    let submitterUser = null; // Store submitter user for later comparison
    
    // 1. ALWAYS notify the document owner (submitter) with personalized messages when status changes
    // This is critical - the owner must know when someone else takes action on their file
    if (document.submittedBy) {
      console.log(`🔍 Looking for submitter: "${document.submittedBy}" for event: ${eventType}`);
      
      // Try to find user by username first
      submitterUser = await User.findOne({ username: document.submittedBy });
      
      // If not found by username, try to find by employee name (submittedBy might be employee name)
      if (!submitterUser) {
        const Employee = require('../models/Employee');
        const employee = await Employee.findOne({ name: document.submittedBy });
        if (employee && employee.employeeId) {
          console.log(`  Found employee: ${employee.name}, employeeId: ${employee.employeeId}`);
          submitterUser = await User.findOne({ employeeId: employee.employeeId });
        }
      }
      
      // Also try finding by email if submittedBy might be an email
      if (!submitterUser) {
        submitterUser = await User.findOne({ email: document.submittedBy });
      }
      
      if (submitterUser) {
        // Get personalized message for submitter (owner)
        const title = getNotificationTitle(eventType, document, true); // true = isSubmitter
        const message = getNotificationMessage(eventType, document, options, true); // true = isSubmitter
        
        notifications.push({
          userId: submitterUser._id.toString(),
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
        console.log(`✅ Notification sent to document owner: ${submitterUser.username || submitterUser.email} (ID: ${submitterUser._id}) - "${title}"`);
        console.log(`   Message: "${message}"`);
      } else {
        console.log(`❌ User not found for document owner: "${document.submittedBy}". Tried username, employee name, and email lookup.`);
        console.log(`   Document ID: ${document.documentId}, Event: ${eventType}`);
        console.log(`   ⚠️ OWNER WILL NOT BE NOTIFIED - This is a problem!`);
      }
    } else {
      console.log(`⚠️ Document has no submittedBy field. Document ID: ${document.documentId}, Event: ${eventType}`);
      console.log(`   ⚠️ OWNER CANNOT BE NOTIFIED - Document missing submitter information!`);
    }
    
    // 2. Notify other users (ONLY for document uploads, NOT for status changes)
    // IMPORTANT: Status changes should ONLY notify the document owner, not admins
    if (eventType === 'document_uploaded') {
      // For uploads, notify ALL users (except the owner) so everyone knows a new document was uploaded
      const usersToNotify = await User.find({});
      console.log(`📢 Document uploaded - notifying all users (except owner)`);
      
      // Get the owner's user ID to exclude them
      const ownerUserId = submitterUser ? submitterUser._id.toString() : null;
      
      for (const user of usersToNotify) {
        // Skip if this user is the document owner (already notified above with personalized message)
        let isOwner = false;
        
        if (ownerUserId) {
          isOwner = user._id.toString() === ownerUserId;
        }
        
        if (!isOwner && document.submittedBy) {
          isOwner = 
            user.username === document.submittedBy || 
            user.email === document.submittedBy;
        }
        
        if (isOwner) {
          continue; // Skip - owner already got personalized notification
        }
        
        // Get non-personalized message (for everyone except the owner)
        const title = getNotificationTitle(eventType, document, false); // false = not submitter
        const message = getNotificationMessage(eventType, document, options, false); // false = not submitter
        
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
            isSubmitter: false,
            ...options
          }
        });
        console.log(`✓ Notification sent to user: ${user.username || user.email} - "${title}"`);
      }
    } else {
      // For status changes and other events: ONLY notify the document owner (already done above)
      // Admins should NOT see status change notifications - only the owner should be notified
      console.log(`📢 Status change event - only owner notified (admins will not receive notification)`);
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
  if (isSubmitter) {
    // Professional, concise titles for document owner
    const ownerTitles = {
      'document_uploaded': 'Document Uploaded',
      'document_updated': 'Status Changed',
      'document_assigned': 'Document Assigned',
      'document_forwarded': 'Document Forwarded',
      'document_approved': 'Approved',
      'document_rejected': 'Rejected',
      'file_updated': 'File Updated'
    };
    return ownerTitles[eventType] || 'Update';
  } else {
    // Professional titles for other users
    const adminTitles = {
      'document_uploaded': 'New Document',
      'document_updated': 'Status Changed',
      'document_assigned': 'Document Assigned',
      'document_forwarded': 'Document Forwarded',
      'document_approved': 'Document Approved',
      'document_rejected': 'Document Rejected',
      'file_updated': 'File Updated'
    };
    return adminTitles[eventType] || 'Update';
  }
};

const getNotificationMessage = (eventType, document, options = {}, isSubmitter = false) => {
  const documentName = document.name || document.documentId || 'Document';
  const currentStatus = document.status || 'Unknown';
  const submittedBy = document.submittedBy || options.submittedBy || 'a user';
  
  if (isSubmitter) {
    // Professional, concise messages for document owner
    const ownerMessages = {
      'document_uploaded': `Uploaded successfully. Status: ${currentStatus}`,
      'document_updated': options.oldStatus && options.oldStatus !== currentStatus 
        ? `${options.oldStatus} → ${currentStatus}`
        : `Status: ${currentStatus}`,
      'document_assigned': `Status: ${currentStatus}`,
      'document_forwarded': `Forwarded to ${options.nextOffice || 'next office'}`,
      'document_approved': `Approved${options.approvedBy ? ` by ${options.approvedBy}` : ''}`,
      'document_rejected': `Rejected${options.rejectedBy ? ` by ${options.rejectedBy}` : ''}${options.comments ? `. ${options.comments}` : ''}`,
      'file_updated': `File updated`
    };
    return ownerMessages[eventType] || `Status: ${currentStatus}`;
  } else {
    // Professional messages for other users
    const adminMessages = {
      'document_uploaded': `Uploaded by ${submittedBy}`,
      'document_updated': `Status: ${currentStatus}`,
      'document_assigned': `Status: ${currentStatus}`,
      'document_forwarded': `Forwarded to ${options.nextOffice || 'next office'}`,
      'document_approved': `Approved${options.approvedBy ? ` by ${options.approvedBy}` : ''}`,
      'document_rejected': `Rejected${options.rejectedBy ? ` by ${options.rejectedBy}` : ''}`,
      'file_updated': `File updated`
    };
    return adminMessages[eventType] || `Status: ${currentStatus}`;
  }
};

module.exports = router;
module.exports.createNotification = createNotification;
module.exports.notifyDocumentEvent = notifyDocumentEvent;

