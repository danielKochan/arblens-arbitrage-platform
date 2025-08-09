import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ProfileSettings = () => {
  const [profileData, setProfileData] = useState({
    fullName: 'Alex Thompson',
    email: 'alex.thompson@arblens.com',
    company: 'Quantum Capital',
    timezone: 'Asia/Jerusalem',
    jurisdiction: 'US',
    language: 'en'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const timezoneOptions = [
    { value: 'Asia/Jerusalem', label: 'Asia/Jerusalem (GMT+2)' },
    { value: 'America/New_York', label: 'America/New_York (GMT-5)' },
    { value: 'Europe/London', label: 'Europe/London (GMT+0)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (GMT+11)' }
  ];

  const jurisdictionOptions = [
    { value: 'US', label: 'United States' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'EU', label: 'European Union' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'ja', label: 'Japanese' }
  ];

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-heading font-semibold text-card-foreground">
          Profile Information
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          Update your account details and regional preferences
        </p>
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Full Name"
            type="text"
            value={profileData?.fullName}
            onChange={(e) => handleInputChange('fullName', e?.target?.value)}
            placeholder="Enter your full name"
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={profileData?.email}
            onChange={(e) => handleInputChange('email', e?.target?.value)}
            placeholder="Enter your email"
            required
          />

          <Input
            label="Company/Organization"
            type="text"
            value={profileData?.company}
            onChange={(e) => handleInputChange('company', e?.target?.value)}
            placeholder="Enter company name"
          />

          <Select
            label="Primary Language"
            options={languageOptions}
            value={profileData?.language}
            onChange={(value) => handleInputChange('language', value)}
          />
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-heading font-medium text-card-foreground mb-4">
          Regional Settings
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Timezone"
            description="Default timezone for all timestamps"
            options={timezoneOptions}
            value={profileData?.timezone}
            onChange={(value) => handleInputChange('timezone', value)}
          />

          <Select
            label="Jurisdiction"
            description="Determines available venues and compliance features"
            options={jurisdictionOptions}
            value={profileData?.jurisdiction}
            onChange={(value) => handleInputChange('jurisdiction', value)}
          />
        </div>

        {profileData?.jurisdiction && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-start space-x-2">
              <Icon name="Info" size={16} color="var(--color-text-secondary)" className="mt-0.5" />
              <div className="text-sm text-text-secondary">
                <strong>Compliance Notice:</strong> Based on your jurisdiction ({jurisdictionOptions?.find(j => j?.value === profileData?.jurisdiction)?.label}), 
                certain venues and features may be restricted. Please ensure compliance with local regulations.
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center space-x-2">
          {saveStatus === 'success' && (
            <>
              <Icon name="CheckCircle" size={16} color="var(--color-success)" />
              <span className="text-sm text-success">Settings saved successfully</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <Icon name="AlertCircle" size={16} color="var(--color-error)" />
              <span className="text-sm text-error">Failed to save settings</span>
            </>
          )}
        </div>
        
        <Button
          variant="default"
          onClick={handleSave}
          loading={isSaving}
          iconName="Save"
          iconPosition="left"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default ProfileSettings;