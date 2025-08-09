import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const SecuritySettings = () => {
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    sessionTimeout: '24',
    loginNotifications: true,
    deviceTrust: true
  });

  const [activeSessions, setActiveSessions] = useState([
    {
      id: '1',
      device: 'MacBook Pro - Chrome',
      location: 'New York, US',
      lastActive: '2025-01-09T17:30:00Z',
      current: true,
      ipAddress: '192.168.1.100'
    },
    {
      id: '2',
      device: 'iPhone 15 - Safari',
      location: 'New York, US',
      lastActive: '2025-01-09T15:20:00Z',
      current: false,
      ipAddress: '192.168.1.101'
    },
    {
      id: '3',
      device: 'Windows PC - Edge',
      location: 'London, UK',
      lastActive: '2025-01-08T09:15:00Z',
      current: false,
      ipAddress: '10.0.0.50'
    }
  ]);

  const [passwordStatus, setPasswordStatus] = useState(null);
  const [twoFactorStatus, setTwoFactorStatus] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleInputChange = (field, value) => {
    setSecurityData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field, checked) => {
    setSecurityData(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handlePasswordChange = async () => {
    if (securityData?.newPassword !== securityData?.confirmPassword) {
      setPasswordStatus('error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPasswordStatus('success');
      setSecurityData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setTimeout(() => setPasswordStatus(null), 3000);
    } catch (error) {
      setPasswordStatus('error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    const newStatus = !securityData?.twoFactorEnabled;
    setTwoFactorStatus('processing');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSecurityData(prev => ({
        ...prev,
        twoFactorEnabled: newStatus
      }));
      setTwoFactorStatus(newStatus ? 'enabled' : 'disabled');
      setTimeout(() => setTwoFactorStatus(null), 3000);
    } catch (error) {
      setTwoFactorStatus('error');
    }
  };

  const terminateSession = async (sessionId) => {
    setActiveSessions(prev => prev?.filter(session => session?.id !== sessionId));
  };

  const terminateAllSessions = async () => {
    setActiveSessions(prev => prev?.filter(session => session?.current));
  };

  const formatLastActive = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Active now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date?.toLocaleDateString();
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password?.length >= 8) strength++;
    if (/[A-Z]/?.test(password)) strength++;
    if (/[a-z]/?.test(password)) strength++;
    if (/[0-9]/?.test(password)) strength++;
    if (/[^A-Za-z0-9]/?.test(password)) strength++;
    
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['text-error', 'text-error', 'text-warning', 'text-warning', 'text-success'];
    
    return {
      strength: (strength / 5) * 100,
      label: labels?.[strength - 1] || '',
      color: colors?.[strength - 1] || ''
    };
  };

  const passwordStrength = getPasswordStrength(securityData?.newPassword);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-heading font-semibold text-card-foreground">
          Security Settings
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          Manage your account security and authentication preferences
        </p>
      </div>
      {/* Password Management */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-heading font-medium text-card-foreground mb-4">
          Password Management
        </h4>
        
        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={securityData?.currentPassword}
            onChange={(e) => handleInputChange('currentPassword', e?.target?.value)}
            placeholder="Enter current password"
          />
          
          <Input
            label="New Password"
            type="password"
            value={securityData?.newPassword}
            onChange={(e) => handleInputChange('newPassword', e?.target?.value)}
            placeholder="Enter new password"
            description="Minimum 8 characters with mixed case, numbers, and symbols"
          />
          
          {securityData?.newPassword && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Password Strength:</span>
                <span className={`font-medium ${passwordStrength?.color}`}>
                  {passwordStrength?.label}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    passwordStrength?.strength < 40 ? 'bg-error' :
                    passwordStrength?.strength < 80 ? 'bg-warning' : 'bg-success'
                  }`}
                  style={{ width: `${passwordStrength?.strength}%` }}
                />
              </div>
            </div>
          )}
          
          <Input
            label="Confirm New Password"
            type="password"
            value={securityData?.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e?.target?.value)}
            placeholder="Confirm new password"
            error={securityData?.confirmPassword && securityData?.newPassword !== securityData?.confirmPassword ? 'Passwords do not match' : ''}
          />
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              {passwordStatus === 'success' && (
                <>
                  <Icon name="CheckCircle" size={16} color="var(--color-success)" />
                  <span className="text-sm text-success">Password updated successfully</span>
                </>
              )}
              {passwordStatus === 'error' && (
                <>
                  <Icon name="AlertCircle" size={16} color="var(--color-error)" />
                  <span className="text-sm text-error">Failed to update password</span>
                </>
              )}
            </div>
            
            <Button
              variant="default"
              onClick={handlePasswordChange}
              loading={isChangingPassword}
              disabled={!securityData?.currentPassword || !securityData?.newPassword || 
                       securityData?.newPassword !== securityData?.confirmPassword}
              iconName="Key"
              iconPosition="left"
            >
              Update Password
            </Button>
          </div>
        </div>
      </div>
      {/* Two-Factor Authentication */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-md font-heading font-medium text-card-foreground">
              Two-Factor Authentication
            </h4>
            <p className="text-sm text-text-secondary mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {twoFactorStatus === 'processing' && (
              <div className="flex items-center space-x-2 text-text-secondary">
                <Icon name="Loader2" size={16} className="animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
            
            <Button
              variant={securityData?.twoFactorEnabled ? "destructive" : "default"}
              onClick={handleTwoFactorToggle}
              disabled={twoFactorStatus === 'processing'}
              iconName={securityData?.twoFactorEnabled ? "ShieldOff" : "Shield"}
              iconPosition="left"
            >
              {securityData?.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
            </Button>
          </div>
        </div>
        
        {securityData?.twoFactorEnabled && (
          <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="CheckCircle" size={16} color="var(--color-success)" />
              <span className="text-sm text-success font-medium">
                Two-factor authentication is enabled
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              Your account is protected with authenticator app verification
            </p>
          </div>
        )}
        
        {twoFactorStatus === 'enabled' && (
          <div className="mt-3 text-sm text-success">
            ✓ Two-factor authentication has been enabled successfully
          </div>
        )}
      </div>
      {/* Session Management */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-heading font-medium text-card-foreground">
            Active Sessions
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={terminateAllSessions}
            iconName="LogOut"
            iconPosition="left"
          >
            Terminate All Others
          </Button>
        </div>
        
        <div className="space-y-3">
          {activeSessions?.map((session) => (
            <div key={session?.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-start space-x-3">
                <Icon 
                  name={session?.device?.includes('iPhone') ? 'Smartphone' : 
                        session?.device?.includes('MacBook') ? 'Laptop' : 'Monitor'} 
                  size={18} 
                  color="var(--color-text-secondary)" 
                />
                <div>
                  <div className="text-sm font-medium text-card-foreground">
                    {session?.device}
                    {session?.current && (
                      <span className="ml-2 px-2 py-0.5 bg-success/10 text-success text-xs rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-secondary mt-1">
                    {session?.location} • {session?.ipAddress}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {formatLastActive(session?.lastActive)}
                  </div>
                </div>
              </div>
              
              {!session?.current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => terminateSession(session?.id)}
                  iconName="X"
                  iconPosition="left"
                >
                  Terminate
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Security Preferences */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-heading font-medium text-card-foreground mb-4">
          Security Preferences
        </h4>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Session Timeout (hours)"
              type="number"
              min="1"
              max="168"
              value={securityData?.sessionTimeout}
              onChange={(e) => handleInputChange('sessionTimeout', e?.target?.value)}
              description="Automatically log out after inactivity"
            />
          </div>
          
          <div className="space-y-3 pt-2">
            <Checkbox
              label="Login Notifications"
              description="Email alerts for new device logins"
              checked={securityData?.loginNotifications}
              onChange={(e) => handleCheckboxChange('loginNotifications', e?.target?.checked)}
            />
            
            <Checkbox
              label="Trust Known Devices"
              description="Skip 2FA on recognized devices for 30 days"
              checked={securityData?.deviceTrust}
              onChange={(e) => handleCheckboxChange('deviceTrust', e?.target?.checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;