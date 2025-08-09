import React, { useState } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const CreateApiKeyModal = ({ isOpen, onClose, onCreateKey }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permission: 'read-only',
    rateLimit: 1000,
    ipWhitelist: '',
    expiresAt: '',
    enableWebhooks: false,
    enableRealtime: false
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData?.name?.trim()) {
      newErrors.name = 'API key name is required';
    }
    
    if (!formData?.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData?.rateLimit < 100 || formData?.rateLimit > 10000) {
      newErrors.rateLimit = 'Rate limit must be between 100 and 10,000';
    }
    
    if (formData?.ipWhitelist && !isValidIpList(formData?.ipWhitelist)) {
      newErrors.ipWhitelist = 'Please enter valid IP addresses separated by commas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const isValidIpList = (ipList) => {
    const ips = ipList?.split(',')?.map(ip => ip?.trim());
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ips?.every(ip => ipRegex?.test(ip));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const newApiKey = {
      id: `key_${Date.now()}`,
      name: formData?.name,
      description: formData?.description,
      permission: formData?.permission,
      rateLimit: formData?.rateLimit,
      ipWhitelist: formData?.ipWhitelist ? formData?.ipWhitelist?.split(',')?.map(ip => ip?.trim()) : null,
      expiresAt: formData?.expiresAt || null,
      enableWebhooks: formData?.enableWebhooks,
      enableRealtime: formData?.enableRealtime,
      key: `arb_${Math.random()?.toString(36)?.substr(2, 32)}`,
      status: 'active',
      usage: 0,
      quota: getQuotaByPermission(formData?.permission),
      createdAt: new Date()?.toISOString(),
      lastUsed: null
    };
    
    onCreateKey(newApiKey);
    handleClose();
  };

  const getQuotaByPermission = (permission) => {
    switch (permission) {
      case 'read-only':
        return 10000;
      case 'read-write':
        return 50000;
      case 'full':
        return 100000;
      default:
        return 10000;
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      permission: 'read-only',
      rateLimit: 1000,
      ipWhitelist: '',
      expiresAt: '',
      enableWebhooks: false,
      enableRealtime: false
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-card-foreground font-heading">
            Create New API Key
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            iconName="X"
            iconSize={20}
            className="w-8 h-8"
          />
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-card-foreground font-heading">
              Basic Information
            </h3>
            
            <Input
              label="API Key Name"
              type="text"
              placeholder="e.g., Production Trading Bot"
              value={formData?.name}
              onChange={(e) => handleInputChange('name', e?.target?.value)}
              error={errors?.name}
              required
            />
            
            <Input
              label="Description"
              type="text"
              placeholder="Brief description of this API key's purpose"
              value={formData?.description}
              onChange={(e) => handleInputChange('description', e?.target?.value)}
              error={errors?.description}
              required
            />
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-card-foreground font-heading">
              Permissions
            </h3>
            
            <div className="space-y-3">
              {[
                { value: 'read-only', label: 'Read Only', description: 'Access to view data only (10K requests/month)' },
                { value: 'read-write', label: 'Read & Write', description: 'Access to view and create alerts (50K requests/month)' },
                { value: 'full', label: 'Full Access', description: 'Complete API access including admin functions (100K requests/month)' }
              ]?.map((permission) => (
                <label key={permission?.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="permission"
                    value={permission?.value}
                    checked={formData?.permission === permission?.value}
                    onChange={(e) => handleInputChange('permission', e?.target?.value)}
                    className="mt-1 w-4 h-4 text-primary border-border focus:ring-primary"
                  />
                  <div>
                    <div className="font-medium text-card-foreground">{permission?.label}</div>
                    <div className="text-sm text-text-secondary">{permission?.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Rate Limiting */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-card-foreground font-heading">
              Rate Limiting
            </h3>
            
            <Input
              label="Requests per Minute"
              type="number"
              placeholder="1000"
              value={formData?.rateLimit}
              onChange={(e) => handleInputChange('rateLimit', parseInt(e?.target?.value))}
              error={errors?.rateLimit}
              min="100"
              max="10000"
              required
            />
          </div>

          {/* Security */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-card-foreground font-heading">
              Security Settings
            </h3>
            
            <Input
              label="IP Whitelist (Optional)"
              type="text"
              placeholder="192.168.1.1, 10.0.0.1"
              value={formData?.ipWhitelist}
              onChange={(e) => handleInputChange('ipWhitelist', e?.target?.value)}
              error={errors?.ipWhitelist}
              description="Comma-separated list of IP addresses that can use this key"
            />
            
            <Input
              label="Expiration Date (Optional)"
              type="date"
              value={formData?.expiresAt}
              onChange={(e) => handleInputChange('expiresAt', e?.target?.value)}
              description="Leave empty for no expiration"
            />
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-card-foreground font-heading">
              Features
            </h3>
            
            <div className="space-y-3">
              <Checkbox
                label="Enable Webhook Notifications"
                description="Allow this key to receive webhook notifications for alerts"
                checked={formData?.enableWebhooks}
                onChange={(e) => handleInputChange('enableWebhooks', e?.target?.checked)}
              />
              
              <Checkbox
                label="Enable Real-time Data Access"
                description="Access to WebSocket streams for live market data"
                checked={formData?.enableRealtime}
                onChange={(e) => handleInputChange('enableRealtime', e?.target?.checked)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              iconName="Plus"
              iconPosition="left"
            >
              Create API Key
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateApiKeyModal;