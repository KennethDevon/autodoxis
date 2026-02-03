const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Document = require('../models/Document');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Office = require('../models/Office');
const { Op } = require('sequelize');

// Get all notifications for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { limit = 50, unreadOnly = false } = req.query;
    // Convert userId to string to match the database schema (userId is STRING(255))
    const userId = req.params.userId.toString();
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const where = { userId };
    
    if (unreadOnly === 'true') {
      where.read = false;
    }
    
    // Try to include related models, but handle errors gracefully
    let notifications;
    try {
      notifications = await Notification.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        include: [
          { 
            model: Document, 
            as: 'document', 
            attributes: ['documentId', 'name', 'status'],
            required: false // LEFT JOIN - don't fail if document doesn't exist
          },
          { 
            model: Employee, 
            as: 'employee', 
            attributes: ['name', 'email'],
            required: false // LEFT JOIN - don't fail if employee doesn't exist
          }
        ]
      });
    } catch (includeError) {
      // If include fails (associations not set up), fetch without includes
      console.warn('Warning: Failed to include related models, fetching without includes:', includeError.message);
      notifications = await Notification.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      });
    }
    
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    console.error('Error details:', err.stack);
    res.status(500).json({ message: err.message });
  }
});

// Get notifications for an employee (by employeeId)
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { limit = 50, unreadOnly = false } = req.query;
    const where = { employeeId: req.params.employeeId };
    
    if (unreadOnly === 'true') {
      where.read = false;
    }
    
    const notifications = await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      include: [
        { model: Document, as: 'document', attributes: ['documentId', 'name', 'status'] },
        { model: Employee, as: 'employee', attributes: ['name', 'email'] }
      ]
    });
    
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching employee notifications:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get unread count for a user
router.get('/user/:userId/unread-count', async (req, res) => {
  try {
    const count = await Notification.count({ 
      where: {
        userId: req.params.userId, 
        read: false 
      }
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
    const count = await Notification.count({ 
      where: {
        employeeId: req.params.employeeId, 
        read: false 
      }
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
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    await notification.update({ read: true });
    
    res.json(notification);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: err.message });
  }
});

// Mark all notifications as read for a user
router.patch('/user/:userId/read-all', async (req, res) => {
  try {
    const [updatedCount] = await Notification.update(
      { read: true },
      { 
        where: { 
          userId: req.params.userId, 
          read: false 
        }
      }
    );
    
    res.json({ 
      message: 'All notifications marked as read',
      updatedCount 
    });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ message: err.message });
  }
});

// Mark all notifications as read for an employee
router.patch('/employee/:employeeId/read-all', async (req, res) => {
  try {
    const [updatedCount] = await Notification.update(
      { read: true },
      { 
        where: { 
          employeeId: req.params.employeeId, 
          read: false 
        }
      }
    );
    
    res.json({ 
      message: 'All notifications marked as read',
      updatedCount 
    });
  } catch (err) {
    console.error('Error marking all employee notifications as read:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    await notification.destroy();
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete all notifications for a user
router.delete('/user/:userId/all', async (req, res) => {
  try {
    const deletedCount = await Notification.destroy({ 
      where: { userId: req.params.userId } 
    });
    res.json({ 
      message: 'All notifications deleted',
      deletedCount 
    });
  } catch (err) {
    console.error('Error deleting all notifications:', err);
    res.status(500).json({ message: err.message });
  }
});

// Helper function to create notifications (can be imported by other routes)
const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
};

// Helper function to find users who should receive the document (next recipients)
// Returns array of user IDs that should be notified
const findNextRecipients = async (document) => {
  const recipientUserIds = new Set();
  
  try {
    // 1. Check if document is assigned to a specific employee (currentHandlerId)
    if (document.currentHandlerId) {
      console.log(`🔍 Finding user for currentHandlerId: ${document.currentHandlerId}`);
      const employee = await Employee.findByPk(document.currentHandlerId);
      if (employee && employee.employeeId) {
        const user = await User.findOne({ where: { employeeId: employee.employeeId } });
        if (user) {
          recipientUserIds.add(user.id.toString());
          console.log(`  ✓ Found user for employee ${employee.name}: ${user.username || user.email}`);
        } else {
          console.log(`  ⚠️ No user found for employee ${employee.name} (employeeId: ${employee.employeeId})`);
        }
      }
    }
    
    // 2. Check if document is assigned to an office (nextOffice)
    if (document.nextOffice && document.nextOffice.trim() !== '') {
      console.log(`🔍 Finding users for nextOffice: ${document.nextOffice}`);
      
      // Try to find office by name
      const office = await Office.findOne({ where: { name: document.nextOffice } });
      if (office) {
        // Find all employees in this office using the association
        const employees = await Employee.findAll({ 
          where: { officeId: office.id },
          include: [{ model: Office, as: 'office' }]
        });
        console.log(`  Found ${employees.length} employees in office ${document.nextOffice}`);
        
        // Find users for each employee
        for (const emp of employees) {
          if (emp.employeeId) {
            const user = await User.findOne({ where: { employeeId: emp.employeeId } });
            if (user) {
              recipientUserIds.add(user.id.toString());
              console.log(`    ✓ Found user for employee ${emp.name}: ${user.username || user.email}`);
            }
          }
        }
      } else {
        // If office not found by name, try to find employees by department (fallback)
        console.log(`  Office "${document.nextOffice}" not found, trying department match...`);
        const employees = await Employee.findAll({ where: { department: document.nextOffice } });
        for (const emp of employees) {
          if (emp.employeeId) {
            const user = await User.findOne({ where: { employeeId: emp.employeeId } });
            if (user) {
              recipientUserIds.add(user.id.toString());
              console.log(`    ✓ Found user for employee ${emp.name} (department match): ${user.username || user.email}`);
            }
          }
        }
      }
    }
    
    return Array.from(recipientUserIds);
  } catch (err) {
    console.error('Error finding next recipients:', err);
    return Array.from(recipientUserIds); // Return what we found so far
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
      
      // Try multiple methods to find the submitter user
      // Method 1: Try to find user by username
      submitterUser = await User.findOne({ where: { username: document.submittedBy } });
      if (submitterUser) {
        console.log(`  ✓ Found by username: ${submitterUser.username} (ID: ${submitterUser.id})`);
      }
      
      // Method 2: Try to find by employee name (submittedBy might be employee name)
      if (!submitterUser) {
        const Employee = require('../models/Employee');
        // Try exact match first
        let employee = await Employee.findOne({ where: { name: document.submittedBy } });
        
        // If not found, try partial match (in case of variations)
        if (!employee) {
          // Try matching with name that contains the submittedBy value
          const allEmployees = await Employee.findAll();
          employee = allEmployees.find(emp => 
            emp.name.toLowerCase().includes(document.submittedBy.toLowerCase()) ||
            document.submittedBy.toLowerCase().includes(emp.name.toLowerCase())
          );
        }
        
        if (employee && employee.employeeId) {
          console.log(`  ✓ Found employee: ${employee.name}, employeeId: ${employee.employeeId}`);
          submitterUser = await User.findOne({ where: { employeeId: employee.employeeId } });
          if (submitterUser) {
            console.log(`  ✓ Found user linked to employee: ${submitterUser.username || submitterUser.email}`);
          } else {
            console.log(`  ⚠️ Employee found but no user linked (employeeId: ${employee.employeeId})`);
          }
        } else {
          console.log(`  ⚠️ No employee found with name: "${document.submittedBy}"`);
        }
      }
      
      // Method 3: Try finding by email if submittedBy might be an email
      if (!submitterUser) {
        submitterUser = await User.findOne({ where: { email: document.submittedBy } });
        if (submitterUser) {
          console.log(`  ✓ Found by email: ${submitterUser.email}`);
        }
      }
      
      // Method 4: Try finding by partial username match (case-insensitive)
      if (!submitterUser) {
        const allUsers = await User.findAll();
        submitterUser = allUsers.find(user => 
          user.username && user.username.toLowerCase().includes(document.submittedBy.toLowerCase()) ||
          user.email && user.email.toLowerCase().includes(document.submittedBy.toLowerCase())
        );
        if (submitterUser) {
          console.log(`  ✓ Found by partial match: ${submitterUser.username || submitterUser.email}`);
        }
      }
      
      if (submitterUser) {
        // Get personalized message for submitter (owner)
        const title = getNotificationTitle(eventType, document, true); // true = isSubmitter
        const message = getNotificationMessage(eventType, document, options, true); // true = isSubmitter
        
        notifications.push({
          userId: submitterUser.id.toString(),
          type: eventType,
          title,
          message,
          documentId: document.id,
          documentName: document.name,
          metadata: {
            documentId: document.documentId,
            status: document.status,
            isSubmitter: true,
            ...options
          }
        });
        console.log(`✅ Notification sent to document owner: ${submitterUser.username || submitterUser.email} (ID: ${submitterUser.id}) - "${title}"`);
        console.log(`   Message: "${message}"`);
      } else {
        console.log(`❌ User not found for document owner: "${document.submittedBy}". Tried username, employee name, email, and partial match.`);
        console.log(`   Document ID: ${document.documentId}, Event: ${eventType}`);
        console.log(`   ⚠️ OWNER WILL NOT BE NOTIFIED - This is a problem!`);
        
        // Log all users for debugging
        const allUsers = await User.findAll({ attributes: ['username', 'email', 'employeeId'] });
        console.log(`   Available users: ${JSON.stringify(allUsers.map(u => ({ username: u.username, email: u.email, employeeId: u.employeeId })), null, 2)}`);
      }
    } else {
      console.log(`⚠️ Document has no submittedBy field. Document ID: ${document.documentId}, Event: ${eventType}`);
      console.log(`   ⚠️ OWNER CANNOT BE NOTIFIED - Document missing submitter information!`);
    }
    
    // 2. Notify next recipients (users who should receive the document)
    // This applies to both uploads and forwarding events
    // Skip for document_returned since document is going back to submitter
    const nextRecipientIds = eventType === 'document_returned' ? [] : await findNextRecipients(document);
    const ownerUserId = submitterUser ? submitterUser.id.toString() : null;
    
    if (nextRecipientIds.length > 0) {
      console.log(`📬 Notifying ${nextRecipientIds.length} next recipient(s) for event: ${eventType}`);
      
      for (const recipientId of nextRecipientIds) {
        // Skip if recipient is the document owner (already notified above with personalized message)
        if (ownerUserId && recipientId === ownerUserId) {
          continue;
        }
        
        // Determine the notification message based on event type
        let title, message;
        if (eventType === 'document_uploaded') {
          // Check if document has been forwarded (has routing history with forward actions)
          const hasForwardingHistory = document.routingHistory && document.routingHistory.some(
            entry => entry.action && entry.action.toLowerCase().includes('forward')
          );
          
          if (hasForwardingHistory) {
            // Document has been forwarded, find the most recent forwarder
            const forwardEntries = document.routingHistory
              .filter(entry => entry.action && entry.action.toLowerCase().includes('forward'))
              .sort((a, b) => {
                const aTime = new Date(a.timestamp || a.date || 0);
                const bTime = new Date(b.timestamp || b.date || 0);
                return bTime - aTime;
              });
            
            if (forwardEntries.length > 0) {
              // Get the person who forwarded it (from comments or handler)
              const lastForward = forwardEntries[0];
              let forwardedBy = lastForward.handler || document.forwardedBy;
              
              // Try to extract forwarder name from comments if handler is not available
              if (!forwardedBy && lastForward.comments) {
                const commentMatch = lastForward.comments.match(/by\s+([^"]+)/i);
                if (commentMatch) {
                  forwardedBy = commentMatch[1].trim();
                }
              }
              
              title = 'New Document Forwarded';
              message = `Document "${document.name || document.documentId || 'Document'}" forwarded to you${forwardedBy ? ` by ${forwardedBy}` : ''}`;
            } else {
              // Fallback to original submitter if we can't find forwarder
              title = 'New Document Received';
              message = `New document "${document.name || document.documentId || 'Document'}" sent to you by ${document.submittedBy || 'a user'}`;
            }
          } else {
            // Fresh upload with no forwarding history, show original submitter
            title = 'New Document Received';
            message = `New document "${document.name || document.documentId || 'Document'}" sent to you by ${document.submittedBy || 'a user'}`;
          }
        } else if (eventType === 'document_forwarded') {
          title = 'New Document Forwarded';
          // Use forwardedBy from options, or try to get from document/routing history
          let forwardedBy = options.forwardedBy || options.employeeName || options.reviewer;
          if (!forwardedBy && document.routingHistory && document.routingHistory.length > 0) {
            // Get the most recent forward entry
            const forwardEntries = document.routingHistory
              .filter(entry => entry.action && entry.action.toLowerCase().includes('forward'))
              .sort((a, b) => {
                const aTime = new Date(a.timestamp || a.date || 0);
                const bTime = new Date(b.timestamp || b.date || 0);
                return bTime - aTime;
              });
            if (forwardEntries.length > 0) {
              forwardedBy = forwardEntries[0].handler;
            }
            if (!forwardedBy) {
              forwardedBy = document.forwardedBy;
            }
          }
          console.log(`  📬 Forwarding notification - forwardedBy: "${forwardedBy}", options:`, options);
          message = `Document "${document.name || document.documentId || 'Document'}" forwarded to you${forwardedBy ? ` by ${forwardedBy}` : ''}`;
        } else {
          // For other events (approved, rejected, etc.), use standard messages
          title = getNotificationTitle(eventType, document, false);
          message = getNotificationMessage(eventType, document, options, false);
        }
        
        notifications.push({
          userId: recipientId,
          type: eventType,
          title,
          message,
          documentId: document.id,
          documentName: document.name,
          metadata: {
            documentId: document.documentId,
            status: document.status,
            isSubmitter: false,
            isRecipient: true,
            ...options
          }
        });
        
        const recipientUser = await User.findByPk(recipientId);
        console.log(`  ✓ Notification sent to recipient: ${recipientUser?.username || recipientUser?.email || recipientId} - "${title}"`);
      }
    } else {
      console.log(`  ⚠️ No next recipients found (no currentHandler or nextOffice specified)`);
    }
    
    // 3. Notify other users (for document uploads AND forwarding events)
    // IMPORTANT: Uploads notify everyone, forwarding notifies admins, status changes only notify owner
    // Skip for document_returned - only notify the owner
    if (eventType === 'document_returned') {
      // Document returned - only notify owner, skip other notifications
      console.log(`📤 Document returned - only owner notified, skipping other user notifications`);
    } else if (eventType === 'document_uploaded') {
      // For uploads, notify ALL users (except the owner and next recipients) so everyone knows a new document was uploaded
      const usersToNotify = await User.findAll();
      console.log(`📢 Document uploaded - notifying all other users (except owner and recipients)`);
      
      for (const user of usersToNotify) {
        const userIdStr = user.id.toString();
        
        // Skip if this user is the document owner (already notified above with personalized message)
        let isOwner = false;
        if (ownerUserId) {
          isOwner = userIdStr === ownerUserId;
        }
        if (!isOwner && document.submittedBy) {
          isOwner = 
            user.username === document.submittedBy || 
            user.email === document.submittedBy;
        }
        
        // Skip if this user is a next recipient (already notified above)
        const isRecipient = nextRecipientIds.includes(userIdStr);
        
        if (isOwner || isRecipient) {
          continue; // Skip - already notified
        }
        
        // Get non-personalized message (for everyone else)
        const title = getNotificationTitle(eventType, document, false); // false = not submitter
        const message = getNotificationMessage(eventType, document, options, false); // false = not submitter
        
        notifications.push({
          userId: userIdStr,
          type: eventType,
          title,
          message,
          documentId: document.id,
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
    } else if (eventType === 'document_forwarded') {
      // For forwarding events, notify ALL ADMIN users so they can track document flow
      const adminUsers = await User.findAll({ where: { role: 'Admin' } });
      console.log(`📢 Document forwarded - notifying all admins (${adminUsers.length} admins)`);
      
      for (const admin of adminUsers) {
        const adminIdStr = admin.id.toString();
        
        // Skip if admin is the document owner (already notified above with personalized message)
        let isOwner = false;
        if (ownerUserId) {
          isOwner = adminIdStr === ownerUserId;
        }
        if (!isOwner && document.submittedBy) {
          isOwner = 
            admin.username === document.submittedBy || 
            admin.email === document.submittedBy;
        }
        
        // Skip if admin is a next recipient (already notified above)
        const isRecipient = nextRecipientIds.includes(adminIdStr);
        
        if (isOwner || isRecipient) {
          continue; // Skip - already notified
        }
        
        // Get non-personalized message for admins
        const title = getNotificationTitle(eventType, document, false); // false = not submitter
        const message = getNotificationMessage(eventType, document, options, false); // false = not submitter
        
        notifications.push({
          userId: adminIdStr,
          type: eventType,
          title,
          message,
          documentId: document.id,
          documentName: document.name,
          metadata: {
            documentId: document.documentId,
            status: document.status,
            isSubmitter: false,
            isAdmin: true,
            ...options
          }
        });
        console.log(`✓ Notification sent to admin: ${admin.username || admin.email} - "${title}"`);
      }
    } else if (eventType === 'document_approved' || eventType === 'document_rejected') {
      // For approval/rejection events, also notify next recipients (if any) about the action
      // This way they know the document status changed before it reaches them
      if (nextRecipientIds.length > 0) {
        console.log(`📬 Notifying ${nextRecipientIds.length} next recipient(s) about ${eventType}`);
        
        for (const recipientId of nextRecipientIds) {
          // Skip if recipient is the document owner (already notified above)
          if (ownerUserId && recipientId === ownerUserId) {
            continue;
          }
          
          const title = getNotificationTitle(eventType, document, false);
          const message = getNotificationMessage(eventType, document, options, false);
          
          notifications.push({
            userId: recipientId,
            type: eventType,
            title,
            message,
            documentId: document.id,
            documentName: document.name,
            metadata: {
              documentId: document.documentId,
              status: document.status,
              isSubmitter: false,
              isRecipient: true,
              ...options
            }
          });
          
          const recipientUser = await User.findByPk(recipientId);
          console.log(`  ✓ Notification sent to recipient: ${recipientUser?.username || recipientUser?.email || recipientId} - "${title}"`);
        }
      }
    } else {
      // For other status changes (approved, rejected, updated): ONLY notify the document owner
      // Admins should NOT see these notifications - only the owner should be notified
      console.log(`📢 Status change event (${eventType}) - only owner notified (admins will not receive notification)`);
    }
    
    // Create all notifications
    if (notifications.length > 0) {
      await Notification.bulkCreate(notifications);
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
      'document_returned': 'Document Returned',
      'file_updated': 'File Updated'
    };
    return ownerTitles[eventType] || 'Update';
  } else {
    // Professional titles for other users (admins and other users)
    const adminTitles = {
      'document_uploaded': 'New Document',
      'document_updated': 'Status Changed',
      'document_assigned': 'Document Assigned',
      'document_forwarded': 'New Document Forwarded', // Changed to "New Document Forwarded"
      'document_approved': 'Document Approved',
      'document_rejected': 'Document Rejected',
      'document_returned': 'Document Returned',
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
    // Professional, concise messages for document owner (sender)
    const ownerMessages = {
      'document_uploaded': `Uploaded successfully. Status: ${currentStatus}`,
      'document_updated': options.oldStatus && options.oldStatus !== currentStatus 
        ? `${options.oldStatus} → ${currentStatus}`
        : `Status: ${currentStatus}`,
      'document_assigned': `Status: ${currentStatus}`,
      'document_forwarded': `Forwarded to ${options.nextOffice || options.employeeName || 'next office'}${options.forwardedBy ? ` by ${options.forwardedBy}` : ''}`,
      'document_approved': options.nextOffice && options.forwardedBy
        ? `Approved${options.approvedBy ? ` by ${options.approvedBy}` : ''} and forwarded to ${options.nextOffice}`
        : `Approved${options.approvedBy ? ` by ${options.approvedBy}` : ''}`,
      'document_rejected': `Rejected${options.rejectedBy ? ` by ${options.rejectedBy}` : ''}${options.comments ? `. ${options.comments}` : ''}`,
      'document_returned': `Returned for editing${options.returnedBy ? ` by ${options.returnedBy}` : ''}${options.comments ? `. ${options.comments}` : ''}`,
      'file_updated': `File updated`
    };
    return ownerMessages[eventType] || `Status: ${currentStatus}`;
  } else {
    // Professional messages for other users (admins, recipients, etc.)
    const adminMessages = {
      'document_uploaded': `Uploaded by ${submittedBy}`,
      'document_updated': `Status: ${currentStatus}`,
      'document_assigned': `Status: ${currentStatus}`,
      'document_forwarded': `Document "${documentName}" forwarded to ${options.nextOffice || options.employeeName || 'next office'}${options.forwardedBy ? ` by ${options.forwardedBy}` : options.updatedBy ? ` by ${options.updatedBy}` : ''}`,
      'document_approved': `Approved${options.approvedBy ? ` by ${options.approvedBy}` : ''}`,
      'document_rejected': `Rejected${options.rejectedBy ? ` by ${options.rejectedBy}` : ''}`,
      'document_returned': `Document "${documentName}" returned to submitter${options.returnedBy ? ` by ${options.returnedBy}` : ''}${options.comments ? `. ${options.comments}` : ''}`,
      'file_updated': `File updated`
    };
    return adminMessages[eventType] || `Status: ${currentStatus}`;
  }
};

module.exports = router;
module.exports.createNotification = createNotification;
module.exports.notifyDocumentEvent = notifyDocumentEvent;

