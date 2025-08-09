import React, { useState, useEffect } from 'react';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';


const DisplaySettings = () => {
  const [displayPrefs, setDisplayPrefs] = useState({
    theme: 'system',
    currency: 'USD',
    numberFormat: 'US',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    compactMode: false,
    animations: true,
    highContrast: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const themeOptions = [
    { value: 'light', label: 'Light Theme' },
    { value: 'dark', label: 'Dark Theme' },
    { value: 'system', label: 'System Default' }
  ];

  const currencyOptions = [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'JPY', label: 'Japanese Yen (¥)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' }
  ];

  const numberFormatOptions = [
    { value: 'US', label: 'US Format (1,000.00)' },
    { value: 'EU', label: 'European Format (1.000,00)' },
    { value: 'IN', label: 'Indian Format (1,00,000.00)' }
  ];

  const dateFormatOptions = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (UK)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
    { value: 'DD MMM YYYY', label: 'DD MMM YYYY (Verbose)' }
  ];

  const timeFormatOptions = [
    { value: '12h', label: '12-hour (2:30 PM)' },
    { value: '24h', label: '24-hour (14:30)' }
  ];

  const handleSelectChange = (field, value) => {
    setDisplayPrefs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field, checked) => {
    setDisplayPrefs(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Apply theme changes
      if (displayPrefs?.theme === 'dark') {
        document.documentElement?.classList?.add('dark');
      } else if (displayPrefs?.theme === 'light') {
        document.documentElement?.classList?.remove('dark');
      }
      
    } finally {
      setIsSaving(false);
    }
  };

  const formatSampleNumber = (value) => {
    switch (displayPrefs?.numberFormat) {
      case 'EU':
        return value?.toLocaleString('de-DE');
      case 'IN':
        return value?.toLocaleString('en-IN');
      default:
        return value?.toLocaleString('en-US');
    }
  };

  const formatSampleDate = () => {
    const date = new Date();
    switch (displayPrefs?.dateFormat) {
      case 'DD/MM/YYYY':
        return date?.toLocaleDateString('en-GB');
      case 'YYYY-MM-DD':
        return date?.toISOString()?.split('T')?.[0];
      case 'DD MMM YYYY':
        return date?.toLocaleDateString('en-US', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        });
      default:
        return date?.toLocaleDateString('en-US');
    }
  };

  const formatSampleTime = () => {
    const date = new Date();
    return displayPrefs?.timeFormat === '24h' ? date?.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      : date?.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-heading font-semibold text-card-foreground">
          Display Settings
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          Customize the appearance and formatting of the interface
        </p>
      </div>
      {/* Theme Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-heading font-medium text-card-foreground mb-4">
          Theme & Appearance
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Color Theme"
            description="Choose your preferred color scheme"
            options={themeOptions}
            value={displayPrefs?.theme}
            onChange={(value) => handleSelectChange('theme', value)}
          />

          <div className="space-y-3">
            <Checkbox
              label="Compact Mode"
              description="Reduce spacing for more content density"
              checked={displayPrefs?.compactMode}
              onChange={(e) => handleCheckboxChange('compactMode', e?.target?.checked)}
            />
            <Checkbox
              label="Enable Animations"
              description="Smooth transitions and loading effects"
              checked={displayPrefs?.animations}
              onChange={(e) => handleCheckboxChange('animations', e?.target?.checked)}
            />
            <Checkbox
              label="High Contrast Mode"
              description="Enhanced contrast for better accessibility"
              checked={displayPrefs?.highContrast}
              onChange={(e) => handleCheckboxChange('highContrast', e?.target?.checked)}
            />
          </div>
        </div>
      </div>
      {/* Currency & Formatting */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-heading font-medium text-card-foreground mb-4">
          Currency & Number Formatting
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Primary Currency"
            description="Default currency for all monetary values"
            options={currencyOptions}
            value={displayPrefs?.currency}
            onChange={(value) => handleSelectChange('currency', value)}
          />

          <Select
            label="Number Format"
            description="How numbers and decimals are displayed"
            options={numberFormatOptions}
            value={displayPrefs?.numberFormat}
            onChange={(value) => handleSelectChange('numberFormat', value)}
          />
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="text-sm text-text-secondary">
            <strong>Preview:</strong> {formatSampleNumber(1234567.89)} {displayPrefs?.currency}
          </div>
        </div>
      </div>
      {/* Date & Time Formatting */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-heading font-medium text-card-foreground mb-4">
          Date & Time Formatting
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Date Format"
            description="How dates are displayed throughout the app"
            options={dateFormatOptions}
            value={displayPrefs?.dateFormat}
            onChange={(value) => handleSelectChange('dateFormat', value)}
          />

          <Select
            label="Time Format"
            description="12-hour or 24-hour time display"
            options={timeFormatOptions}
            value={displayPrefs?.timeFormat}
            onChange={(value) => handleSelectChange('timeFormat', value)}
          />
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="text-sm text-text-secondary">
            <strong>Preview:</strong> {formatSampleDate()} at {formatSampleTime()}
          </div>
        </div>
      </div>
      {/* Preview Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-heading font-medium text-card-foreground">
            Live Preview
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            iconName={previewMode ? "EyeOff" : "Eye"}
            iconPosition="left"
          >
            {previewMode ? 'Hide' : 'Show'} Preview
          </Button>
        </div>

        {previewMode && (
          <div className="border border-border rounded-lg p-4 bg-background">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">BTC/ETH Arbitrage</span>
                <span className="text-sm font-data text-success">
                  +{formatSampleNumber(2.45)}%
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-text-secondary">
                <span>Last Updated</span>
                <span>{formatSampleDate()} {formatSampleTime()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Potential Profit</span>
                <span className="font-data">
                  {formatSampleNumber(1250.75)} {displayPrefs?.currency}
                </span>
              </div>
            </div>
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
          Apply Display Settings
        </Button>
      </div>
    </div>
  );
};

export default DisplaySettings;