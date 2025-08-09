import React, { useState } from 'react';
import { Checkbox } from '../../../components/ui/Checkbox';
import Input from '../../../components/ui/Input';

import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const NotificationSettings = () => {
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: {
      enabled: true,
      opportunities: true,
      alerts: true,
      reports: false,
      system: true
    },
    browser: {
      enabled: true,
      opportunities: true,
      alerts: false,
      system: false
    },
    webhook: {
      enabled: false,
      url: '',
      opportunities: true,
      alerts: true
    }
  });

  const [testStatus, setTestStatus] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const frequencyOptions = [
    { value: 'immediate', label: 'Immediate' },
    { value: 'hourly', label: 'Hourly digest' },
    { value: 'daily', label: 'Daily digest' },
    { value: 'weekly', label: 'Weekly digest' }
  ];

  const handleCheckboxChange = (category, field, checked) => {
    setNotificationPrefs(prev => ({
      ...prev,
      [category]: {
        ...prev?.[category],
        [field]: checked
      }
    }));
  };

  const handleInputChange = (category, field, value) => {
    setNotificationPrefs(prev => ({
      ...prev,
      [category]: {
        ...prev?.[category],
        [field]: value
      }
    }));
  };

  const testNotification = async (type) => {
    setTestStatus(prev => ({ ...prev, [type]: 'testing' }));
    
    try {
      // Simulate test notification
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestStatus(prev => ({ ...prev, [type]: 'success' }));
      setTimeout(() => {
        setTestStatus(prev => ({ ...prev, [type]: null }));
      }, 3000);
    } catch (error) {
      setTestStatus(prev => ({ ...prev, [type]: 'error' }));
      setTimeout(() => {
        setTestStatus(prev => ({ ...prev, [type]: null }));
      }, 3000);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-heading font-semibold text-card-foreground">
          Notification Preferences
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          Configure how and when you receive alerts and updates
        </p>
      </div>
      {/* Email Notifications */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-md font-heading font-medium text-card-foreground">
              Email Notifications
            </h4>
            <p className="text-sm text-text-secondary">
              Receive notifications via email at alex.thompson@arblens.com
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={notificationPrefs?.email?.enabled}
              onChange={(e) => handleCheckboxChange('email', 'enabled', e?.target?.checked)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => testNotification('email')}
              loading={testStatus?.email === 'testing'}
              disabled={!notificationPrefs?.email?.enabled}
              iconName="Send"
              iconPosition="left"
            >
              Test
            </Button>
          </div>
        </div>

        {notificationPrefs?.email?.enabled && (
          <div className="space-y-3 pl-4 border-l-2 border-muted">
            <Checkbox
              label="Arbitrage Opportunities"
              description="New profitable opportunities above your threshold"
              checked={notificationPrefs?.email?.opportunities}
              onChange={(e) => handleCheckboxChange('email', 'opportunities', e?.target?.checked)}
            />
            <Checkbox
              label="Price Alerts"
              description="Custom price and spread alerts"
              checked={notificationPrefs?.email?.alerts}
              onChange={(e) => handleCheckboxChange('email', 'alerts', e?.target?.checked)}
            />
            <Checkbox
              label="Daily Reports"
              description="Summary of opportunities and performance"
              checked={notificationPrefs?.email?.reports}
              onChange={(e) => handleCheckboxChange('email', 'reports', e?.target?.checked)}
            />
            <Checkbox
              label="System Updates"
              description="Maintenance, outages, and feature updates"
              checked={notificationPrefs?.email?.system}
              onChange={(e) => handleCheckboxChange('email', 'system', e?.target?.checked)}
            />
          </div>
        )}

        {testStatus?.email === 'success' && (
          <div className="mt-3 flex items-center space-x-2 text-success text-sm">
            <Icon name="CheckCircle" size={16} />
            <span>Test email sent successfully</span>
          </div>
        )}
      </div>
      {/* Browser Notifications */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-md font-heading font-medium text-card-foreground">
              Browser Notifications
            </h4>
            <p className="text-sm text-text-secondary">
              Real-time notifications in your browser
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={notificationPrefs?.browser?.enabled}
              onChange={(e) => handleCheckboxChange('browser', 'enabled', e?.target?.checked)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => testNotification('browser')}
              loading={testStatus?.browser === 'testing'}
              disabled={!notificationPrefs?.browser?.enabled}
              iconName="Bell"
              iconPosition="left"
            >
              Test
            </Button>
          </div>
        </div>

        {notificationPrefs?.browser?.enabled && (
          <div className="space-y-3 pl-4 border-l-2 border-muted">
            <Checkbox
              label="High-Value Opportunities"
              description="Opportunities with &gt;5% spread"
              checked={notificationPrefs?.browser?.opportunities}
              onChange={(e) => handleCheckboxChange('browser', 'opportunities', e?.target?.checked)}
            />
            <Checkbox
              label="Critical Alerts"
              description="System issues and urgent notifications"
              checked={notificationPrefs?.browser?.alerts}
              onChange={(e) => handleCheckboxChange('browser', 'alerts', e?.target?.checked)}
            />
            <Checkbox
              label="System Status"
              description="Connection status and data feed updates"
              checked={notificationPrefs?.browser?.system}
              onChange={(e) => handleCheckboxChange('browser', 'system', e?.target?.checked)}
            />
          </div>
        )}
      </div>
      {/* Webhook Notifications */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-md font-heading font-medium text-card-foreground">
              Webhook Integration
            </h4>
            <p className="text-sm text-text-secondary">
              Send notifications to external systems via HTTP POST
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={notificationPrefs?.webhook?.enabled}
              onChange={(e) => handleCheckboxChange('webhook', 'enabled', e?.target?.checked)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => testNotification('webhook')}
              loading={testStatus?.webhook === 'testing'}
              disabled={!notificationPrefs?.webhook?.enabled || !notificationPrefs?.webhook?.url}
              iconName="Zap"
              iconPosition="left"
            >
              Test
            </Button>
          </div>
        </div>

        {notificationPrefs?.webhook?.enabled && (
          <div className="space-y-4 pl-4 border-l-2 border-muted">
            <Input
              label="Webhook URL"
              type="url"
              placeholder="https://your-server.com/webhook"
              value={notificationPrefs?.webhook?.url}
              onChange={(e) => handleInputChange('webhook', 'url', e?.target?.value)}
              description="HTTPS endpoint to receive POST requests"
            />
            
            <div className="space-y-3">
              <Checkbox
                label="Arbitrage Opportunities"
                description="JSON payload with opportunity details"
                checked={notificationPrefs?.webhook?.opportunities}
                onChange={(e) => handleCheckboxChange('webhook', 'opportunities', e?.target?.checked)}
              />
              <Checkbox
                label="Alert Triggers"
                description="Custom alert conditions and thresholds"
                checked={notificationPrefs?.webhook?.alerts}
                onChange={(e) => handleCheckboxChange('webhook', 'alerts', e?.target?.checked)}
              />
            </div>
          </div>
        )}

        {testStatus?.webhook === 'success' && (
          <div className="mt-3 flex items-center space-x-2 text-success text-sm">
            <Icon name="CheckCircle" size={16} />
            <span>Webhook test successful (200 OK)</span>
          </div>
        )}
      </div>
      <div className="flex justify-end pt-4 border-t border-border">
        <Button
          variant="default"
          onClick={handleSave}
          loading={isSaving}
          iconName="Save"
          iconPosition="left"
        >
          Save Notification Settings
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;