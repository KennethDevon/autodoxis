import React, { useState, useEffect } from 'react';
import API_URL from '../config';

function NotificationSystem({ variant = 'default' }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);
  
  // Load shown notification IDs from localStorage (persists across page navigation)
  const getShownNotificationIds = () => {
    try {
      const stored = localStorage.getItem('notification_shown_ids');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
      return new Set();
    }
  };
  
  const [toastShownTimes, setToastShownTimes] = useState(new Map()); // Track when notifications were shown as toasts
  const [shownNotificationIds, setShownNotificationIds] = useState(getShownNotificationIds()); // Track which notifications have been shown (persisted)

  // Map backend notification types to frontend types
  const mapNotificationType = (backendType) => {
    const typeMap = {
      'document_uploaded': 'info',
      'document_updated': 'info',
      'document_assigned': 'info',
      'document_forwarded': 'info',
      'document_approved': 'success',
      'document_rejected': 'error',
      'file_updated': 'info'
    };
    return typeMap[backendType] || 'info';
  };

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      const userData = localStorage.getItem('userData');
      if (!userData) return;

      const user = JSON.parse(userData);
      const userId = user._id || user.id;
      
      if (!userId) return;

      setLoading(true);
      const response = await fetch(`${API_URL}/notifications/user/${userId}?limit=50`);
      
      if (response.ok) {
        const backendNotifications = await response.json();
        
        // Transform backend notifications to frontend format
        const transformedBackendNotifications = backendNotifications.map(notif => ({
          id: notif._id || notif.id,
          type: mapNotificationType(notif.type),
          title: notif.title,
          message: notif.message,
          timestamp: new Date(notif.createdAt),
          read: notif.read,
          documentId: notif.documentId?._id || notif.documentId,
          documentName: notif.documentName,
          isBackendNotification: true
        }));

        // Merge with existing local notifications (keep local notifications that haven't expired)
        setNotifications(prev => {
          // Keep local notifications that are still valid (not expired)
          const localNotifications = prev.filter(n => !n.isBackendNotification);
          
          // Combine: backend notifications + local notifications
          const merged = [...transformedBackendNotifications, ...localNotifications];
          
          // Sort by timestamp (newest first)
          return merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        });
        
        // Update unread count
        setNotifications(current => {
          const unread = current.filter(n => !n.read).length;
          setUnreadCount(unread);
          return current;
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Listen for custom notification events (for local toast notifications)
    // These are temporary UI notifications, not persistent backend notifications
    const handleNotification = (event) => {
      const newNotification = {
        id: `local_${Date.now()}`,
        type: event.detail.type || 'info', // 'success', 'error', 'warning', 'info'
        title: event.detail.title || 'Notification',
        message: event.detail.message || '',
        timestamp: new Date(),
        read: false,
        isBackendNotification: false,
        isTemporary: true // Mark as temporary for toast notifications
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Auto-remove temporary toast notifications after delay
      // Backend notifications will NOT be auto-removed
      const autoRemoveDelay = ['success', 'info'].includes(newNotification.type) ? 5000 : 10000;
      setTimeout(() => {
        setNotifications(prev => {
          const notification = prev.find(n => n.id === newNotification.id);
          if (notification && !notification.read && notification.isTemporary) {
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));
          }
          // Only remove temporary notifications, keep backend notifications
          return prev.filter(n => n.id !== newNotification.id || !n.isTemporary);
        });
      }, autoRemoveDelay);
    };

    window.addEventListener('showNotification', handleNotification);
    
    return () => {
      window.removeEventListener('showNotification', handleNotification);
    };
  }, []);

  // Sync unreadCount with actual unread notifications
  useEffect(() => {
    const actualUnreadCount = notifications.filter(n => !n.read).length;
    if (actualUnreadCount !== unreadCount) {
      setUnreadCount(actualUnreadCount);
    }
  }, [notifications, unreadCount]);

  // Auto-remove backend notifications from toast after 7 seconds
  // Mark notifications as "shown" so they don't reappear after navigation
  useEffect(() => {
    const unreadBackendNotifications = notifications.filter(
      n => n.isBackendNotification && !n.read && !n.isTemporary
    );

    // Track when backend notifications are first shown (both in memory and localStorage)
    unreadBackendNotifications.forEach(notification => {
      if (!toastShownTimes.has(notification.id) && !shownNotificationIds.has(notification.id)) {
        // Mark as shown in memory
        setToastShownTimes(prev => new Map(prev).set(notification.id, Date.now()));
        
        // Mark as shown in localStorage (persists across navigation)
        setShownNotificationIds(prev => {
          const updated = new Set(prev);
          updated.add(notification.id);
          
          // Save to localStorage (keep last 100 notification IDs to prevent storage bloat)
          try {
            const idsArray = Array.from(updated);
            const recentIds = idsArray.slice(-100); // Keep only last 100
            localStorage.setItem('notification_shown_ids', JSON.stringify(recentIds));
          } catch (e) {
            console.error('Error saving shown notification IDs:', e);
          }
          
          return updated;
        });
      }
    });

    // Clean up old entries from toastShownTimes (keep for 10 seconds to allow for cleanup)
    const now = Date.now();
    setToastShownTimes(prev => {
      const cleaned = new Map();
      prev.forEach((time, id) => {
        if (now - time < 10000) {
          cleaned.set(id, time);
        }
      });
      return cleaned;
    });
  }, [notifications, toastShownTimes, shownNotificationIds]);

  const markAsRead = async (id) => {
    const notification = notifications.find(n => n.id === id);
    
    // Update local state immediately - notification stays visible, just marked as read
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // If it's a backend notification, mark it as read in the backend
    // The notification will remain visible in the list
    if (notification?.isBackendNotification) {
      try {
        await fetch(`${API_URL}/notifications/${id}/read`, {
          method: 'PATCH'
        });
        // Refresh to get updated read status from backend
        fetchNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    const userData = localStorage.getItem('userData');
    if (!userData) return;

    const user = JSON.parse(userData);
    const userId = user._id || user.id;
    
    if (!userId) return;

    // Update local state immediately - all notifications stay visible, just marked as read
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    // Mark all as read in backend
    // Notifications will remain visible in the list
    try {
      await fetch(`${API_URL}/notifications/user/${userId}/read-all`, {
        method: 'PATCH'
      });
      // Refresh to get updated read status from backend
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const removeNotification = async (id) => {
    const notification = notifications.find(n => n.id === id);
    
    // Don't allow deletion of persistent document status notifications
    // Only allow deletion of temporary toast notifications
    if (notification?.isBackendNotification) {
      console.log('Cannot delete persistent document status notifications');
      return;
    }
    
    // Update local state immediately (only for temporary notifications)
    setNotifications(prev => {
      const notif = prev.find(n => n.id === id);
      if (notif && !notif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  };

  const clearAll = async () => {
    // Only clear temporary notifications, keep persistent document status notifications
    setNotifications(prev => {
      const persistentNotifications = prev.filter(n => n.isBackendNotification);
      const unreadPersistent = persistentNotifications.filter(n => !n.read).length;
      setUnreadCount(unreadPersistent);
      return persistentNotifications;
    });
    
    // Don't delete backend notifications - they should persist
    console.log('Cleared temporary notifications. Document status notifications are preserved.');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'error':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        );
      case 'warning':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return { bg: '#f0fdf4', border: '#22c55e', icon: '#16a34a', text: '#15803d' };
      case 'error':
        return { bg: '#fef2f2', border: '#ef4444', icon: '#dc2626', text: '#b91c1c' };
      case 'warning':
        return { bg: '#fffbeb', border: '#f59e0b', icon: '#d97706', text: '#b45309' };
      default:
        return { bg: '#eff6ff', border: '#3b82f6', icon: '#2563eb', text: '#1d4ed8' };
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Notification Bell Icon */}
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) {
            fetchNotifications(); // Refresh when opening dropdown
          }
        }}
        style={{
          position: 'relative',
          background: variant === 'employee' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
          border: variant === 'employee' ? '1px solid rgba(255, 255, 255, 0.25)' : 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          padding: variant === 'employee' ? '10px 12px' : '10px',
          fontSize: '20px',
          color: variant === 'employee' ? 'white' : '#4b5563',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: variant === 'employee' ? 'blur(12px)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px',
          height: '44px'
        }}
        onMouseEnter={(e) => {
          if (variant === 'employee') {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
          } else {
            e.target.style.backgroundColor = '#f3f4f6';
            e.target.style.color = '#2563eb';
          }
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          if (variant === 'employee') {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
          } else {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#4b5563';
          }
          e.target.style.transform = 'scale(1)';
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '10px',
            minWidth: '18px',
            height: '18px',
            fontSize: '11px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Notifications */}
      {showDropdown && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
              backgroundColor: 'rgba(0, 0, 0, 0.1)'
            }}
            onClick={() => setShowDropdown(false)}
          />
          <div style={{
            position: 'absolute',
            top: '52px',
            right: '0',
            width: '420px',
            maxHeight: '600px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e5e7eb',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideDown 0.2s ease-out'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '2px 10px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      padding: '6px 14px',
                      fontSize: '13px',
                      fontWeight: '600',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#2563eb';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#3b82f6';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    style={{
                      padding: '6px 14px',
                      fontSize: '13px',
                      fontWeight: '600',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#4b5563';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#6b7280';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div style={{
              overflowY: 'auto',
              maxHeight: '500px',
              backgroundColor: 'white'
            }}>
              {notifications.length === 0 ? (
                <div style={{
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '15px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔔</div>
                  <div style={{ fontWeight: '500' }}>No notifications</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>You're all caught up!</div>
                </div>
              ) : (
                notifications.map((notification, index) => {
                  const colors = getNotificationColor(notification.type);
                  return (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      style={{
                        padding: '16px 24px',
                        borderBottom: index < notifications.length - 1 ? '1px solid #f3f4f6' : 'none',
                        backgroundColor: notification.read ? '#f9fafb' : '#fafafa',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        borderLeft: `4px solid ${notification.read ? '#e5e7eb' : colors.border}`,
                        opacity: notification.read ? 0.85 : 1
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = notification.read ? 'white' : '#fafafa';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: colors.bg,
                          color: colors.icon,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: `1px solid ${colors.border}20`
                        }}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '15px',
                            fontWeight: notification.read ? '500' : '700',
                            color: '#111827',
                            marginBottom: '6px',
                            lineHeight: '1.4'
                          }}>
                            {notification.title}
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            marginBottom: '8px',
                            wordWrap: 'break-word',
                            lineHeight: '1.5'
                          }}>
                            {notification.message}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            fontWeight: '500'
                          }}>
                            {notification.timestamp.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        {/* Only show delete button for temporary notifications, not persistent document status notifications */}
                        {notification.isTemporary && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#9ca3af',
                              cursor: 'pointer',
                              fontSize: '20px',
                              padding: '4px',
                              flexShrink: 0,
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.color = '#ef4444';
                              e.target.style.backgroundColor = '#fef2f2';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.color = '#9ca3af';
                              e.target.style.backgroundColor = 'transparent';
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Toast Notifications (Bottom Right - Floating) */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '400px',
        pointerEvents: 'none'
      }}>
        {notifications
          .filter(notification => {
            // Always show temporary notifications
            if (notification.isTemporary) return true;
            
            // For backend notifications, only show if:
            // 1. Unread
            // 2. Has NOT been shown before (checked in localStorage)
            // 3. If being shown now, only show for 7 seconds
            if (notification.isBackendNotification) {
              if (notification.read) return false; // Don't show read notifications
              
              // Check if this notification was already shown (persists across navigation)
              if (shownNotificationIds.has(notification.id)) {
                // Only show again if it was shown very recently (within last 7 seconds)
                const shownTime = toastShownTimes.get(notification.id);
                if (!shownTime) return false; // Already shown before, don't show again
                
                const age = Date.now() - shownTime;
                return age < 7000; // Only show if currently being displayed (< 7 seconds old)
              }
              
              // Never shown before, show it
              return true;
            }
            
            return true;
          })
          .slice(0, 3)
          .map((notification) => {
          const colors = getNotificationColor(notification.type);
          return (
            <div
              key={`toast-${notification.id}`}
              style={{
                backgroundColor: 'white',
                padding: '18px 20px',
                borderRadius: '12px',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                borderLeft: `4px solid ${colors.border}`,
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                animation: 'slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), float 3s ease-in-out infinite',
                minWidth: '320px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                transform: 'translateY(0)',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                pointerEvents: 'auto',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 25px 50px -10px rgba(0, 0, 0, 0.2), 0 15px 25px -5px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)';
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: colors.bg,
                color: colors.icon,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `1px solid ${colors.border}20`
              }}>
                {getNotificationIcon(notification.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '6px',
                  lineHeight: '1.4'
                }}>
                  {notification.title}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  lineHeight: '1.5'
                }}>
                  {notification.message}
                </div>
              </div>
              {/* Only show delete button for temporary toast notifications */}
              {notification.isTemporary && (
                <button
                  onClick={() => removeNotification(notification.id)}
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
                    e.target.style.color = '#ef4444';
                    e.target.style.backgroundColor = '#fef2f2';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = '#9ca3af';
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

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
        
        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}

// Helper function to show notifications from anywhere in the app
export const showNotification = (type, title, message) => {
  const event = new CustomEvent('showNotification', {
    detail: { type, title, message }
  });
  window.dispatchEvent(event);
};

export default NotificationSystem;
