import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const NotificationToast = ({ 
  notifications = [], 
  onDismiss = () => {}, 
  onAction = () => {} 
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    setVisibleNotifications(notifications);
  }, [notifications]);

  const handleDismiss = (id) => {
    setVisibleNotifications(prev => prev?.filter(n => n?.id !== id));
    onDismiss(id);
  };

  const handleAction = (notification) => {
    onAction(notification);
    handleDismiss(notification?.id);
  };

  const getToastStyles = (type) => {
    switch (type) {
      case 'opportunity':
        return 'border-success bg-success/5 text-success-foreground';
      case 'warning':
        return 'border-warning bg-warning/5 text-warning-foreground';
      case 'error':
        return 'border-error bg-error/5 text-error-foreground';
      default:
        return 'border-border bg-card text-card-foreground';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'opportunity':
        return 'TrendingUp';
      case 'warning':
        return 'AlertTriangle';
      case 'error':
        return 'AlertCircle';
      default:
        return 'Bell';
    }
  };

  if (visibleNotifications?.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-[1100] space-y-2 w-80 max-w-[calc(100vw-3rem)]">
      {visibleNotifications?.map((notification) => (
        <div
          key={notification?.id}
          className={`
            border rounded-lg p-4 shadow-minimal animate-slide-in
            ${getToastStyles(notification?.type)}
          `}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <Icon 
                name={getIcon(notification?.type)} 
                size={18} 
                color={notification?.type === 'opportunity' ? 'var(--color-success)' : 
                       notification?.type === 'warning' ? 'var(--color-warning)' : 
                       notification?.type === 'error' ? 'var(--color-error)' : 
                       'var(--color-text-primary)'} 
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium font-heading">
                  {notification?.title}
                </h4>
                <button
                  onClick={() => handleDismiss(notification?.id)}
                  className="flex-shrink-0 ml-2 text-text-secondary hover:text-text-primary transition-colors duration-150"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
              
              <p className="mt-1 text-sm text-text-secondary">
                {notification?.message}
              </p>
              
              {notification?.data && (
                <div className="mt-2 p-2 bg-muted rounded text-xs font-data">
                  <div className="flex justify-between">
                    <span>Pair: {notification?.data?.pair}</span>
                    <span className="text-success font-medium">
                      +{notification?.data?.profit}%
                    </span>
                  </div>
                </div>
              )}
              
              {notification?.action && (
                <div className="mt-3 flex space-x-2">
                  <Button
                    size="sm"
                    variant={notification?.type === 'opportunity' ? 'default' : 'outline'}
                    onClick={() => handleAction(notification)}
                    className="text-xs"
                  >
                    {notification?.action?.label}
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Auto-dismiss timer indicator */}
          {notification?.autoClose && (
            <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-100 ease-linear"
                style={{
                  width: `${((notification?.autoClose - (Date.now() - notification?.timestamp)) / notification?.autoClose) * 100}%`
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Example usage component for demonstration
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now()?.toString();
    const newNotification = {
      id,
      timestamp: Date.now(),
      autoClose: notification?.autoClose || 5000,
      ...notification
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-dismiss after specified time
    if (newNotification?.autoClose) {
      setTimeout(() => {
        setNotifications(prev => prev?.filter(n => n?.id !== id));
      }, newNotification?.autoClose);
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev?.filter(n => n?.id !== id));
  };

  return {
    notifications,
    addNotification,
    dismissNotification
  };
};

export default NotificationToast;