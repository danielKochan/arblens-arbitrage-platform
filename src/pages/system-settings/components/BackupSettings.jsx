import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const BackupSettings = () => {
  const [backupData, setBackupData] = useState({
    autoBackup: true,
    backupFrequency: 'weekly',
    includePreferences: true,
    includeAlerts: true,
    includeApiKeys: false,
    teamSync: false,
    syncUrl: ''
  });

  const [backupHistory, setBackupHistory] = useState([
    {
      id: '1',
      date: '2025-01-09T10:30:00Z',
      type: 'manual',
      size: '2.4 KB',
      status: 'completed'
    },
    {
      id: '2',
      date: '2025-01-02T09:15:00Z',
      type: 'automatic',
      size: '2.1 KB',
      status: 'completed'
    },
    {
      id: '3',
      date: '2024-12-26T08:45:00Z',
      type: 'automatic',
      size: '1.9 KB',
      status: 'completed'
    }
  ]);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

  const handleCheckboxChange = (field, checked) => {
    setBackupData(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleInputChange = (field, value) => {
    setBackupData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus(null);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create mock export data
      const exportData = {
        version: '1.0',
        timestamp: new Date()?.toISOString(),
        settings: {
          profile: backupData?.includePreferences ? {
            timezone: 'Asia/Jerusalem',
            currency: 'USD',
            theme: 'system'
          } : null,
          notifications: backupData?.includeAlerts ? {
            email: true,
            browser: true,
            webhook: false
          } : null,
          trading: {
            riskTolerance: 'moderate',
            minSpread: '2.5',
            defaultVenues: ['polymarket', 'kalshi']
          }
        }
      };
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arblens-settings-${new Date()?.toISOString()?.split('T')?.[0]}.json`;
      document.body?.appendChild(a);
      a?.click();
      document.body?.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportStatus('success');
      
      // Add to backup history
      const newBackup = {
        id: Date.now()?.toString(),
        date: new Date()?.toISOString(),
        type: 'manual',
        size: '2.6 KB',
        status: 'completed'
      };
      setBackupHistory(prev => [newBackup, ...prev]);
      
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setImportStatus(null);
    
    try {
      const text = await file?.text();
      const importedData = JSON.parse(text);
      
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Validate import data structure
      if (!importedData?.version || !importedData?.settings) {
        throw new Error('Invalid backup file format');
      }
      
      setImportStatus('success');
      setTimeout(() => setImportStatus(null), 3000);
    } catch (error) {
      setImportStatus('error');
      setTimeout(() => setImportStatus(null), 3000);
    } finally {
      setIsImporting(false);
      event.target.value = ''; // Reset file input
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp)?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadBackup = (backupId) => {
    // Simulate downloading a previous backup
    console.log(`Downloading backup ${backupId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-heading font-semibold text-card-foreground">
          Backup & Export
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          Backup your settings and sync with team members
        </p>
      </div>
      {/* Export Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-heading font-medium text-card-foreground mb-4">
          Export Settings
        </h4>
        
        <div className="space-y-4">
          <div className="text-sm text-text-secondary mb-3">
            Choose which settings to include in your backup:
          </div>
          
          <div className="space-y-3">
            <Checkbox
              label="Profile & Display Preferences"
              description="Theme, currency, timezone, and formatting settings"
              checked={backupData?.includePreferences}
              onChange={(e) => handleCheckboxChange('includePreferences', e?.target?.checked)}
            />
            
            <Checkbox
              label="Notification & Alert Rules"
              description="Email, browser, and webhook notification preferences"
              checked={backupData?.includeAlerts}
              onChange={(e) => handleCheckboxChange('includeAlerts', e?.target?.checked)}
            />
            
            <Checkbox
              label="API Keys & Credentials"
              description="Encrypted API keys and authentication tokens"
              checked={backupData?.includeApiKeys}
              onChange={(e) => handleCheckboxChange('includeApiKeys', e?.target?.checked)}
            />
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-2">
              {exportStatus === 'success' && (
                <>
                  <Icon name="CheckCircle" size={16} color="var(--color-success)" />
                  <span className="text-sm text-success">Settings exported successfully</span>
                </>
              )}
              {exportStatus === 'error' && (
                <>
                  <Icon name="AlertCircle" size={16} color="var(--color-error)" />
                  <span className="text-sm text-error">Export failed</span>
                </>
              )}
            </div>
            
            <Button
              variant="default"
              onClick={handleExport}
              loading={isExporting}
              iconName="Download"
              iconPosition="left"
            >
              Export Settings
            </Button>
          </div>
        </div>
      </div>
      {/* Import Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-heading font-medium text-card-foreground mb-4">
          Import Settings
        </h4>
        
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Restore settings from a previously exported backup file. This will overwrite your current preferences.
          </p>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <Button
                variant="outline"
                disabled={isImporting}
                loading={isImporting}
                iconName="Upload"
                iconPosition="left"
              >
                Choose Backup File
              </Button>
            </div>
            
            {importStatus === 'success' && (
              <div className="flex items-center space-x-2 text-success">
                <Icon name="CheckCircle" size={16} />
                <span className="text-sm">Settings imported successfully</span>
              </div>
            )}
            {importStatus === 'error' && (
              <div className="flex items-center space-x-2 text-error">
                <Icon name="AlertCircle" size={16} />
                <span className="text-sm">Import failed - invalid file format</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Team Sync */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-heading font-medium text-card-foreground mb-4">
          Team Synchronization
        </h4>
        
        <div className="space-y-4">
          <Checkbox
            label="Enable Team Sync"
            description="Share settings with team members via secure endpoint"
            checked={backupData?.teamSync}
            onChange={(e) => handleCheckboxChange('teamSync', e?.target?.checked)}
          />
          
          {backupData?.teamSync && (
            <Input
              label="Sync Endpoint URL"
              type="url"
              placeholder="https://your-team-server.com/sync"
              value={backupData?.syncUrl}
              onChange={(e) => handleInputChange('syncUrl', e?.target?.value)}
              description="Secure HTTPS endpoint for team settings synchronization"
            />
          )}
          
          {backupData?.teamSync && backupData?.syncUrl && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start space-x-2">
                <Icon name="Info" size={16} color="var(--color-text-secondary)" className="mt-0.5" />
                <div className="text-sm text-text-secondary">
                  <strong>Team Sync:</strong> Settings will be automatically synchronized with your team endpoint. 
                  Only non-sensitive preferences like display settings and trading defaults will be shared.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Backup History */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-heading font-medium text-card-foreground mb-4">
          Backup History
        </h4>
        
        <div className="space-y-3">
          {backupHistory?.map((backup) => (
            <div key={backup?.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <Icon 
                  name={backup?.type === 'manual' ? 'Download' : 'Clock'} 
                  size={16} 
                  color="var(--color-text-secondary)" 
                />
                <div>
                  <div className="text-sm font-medium text-card-foreground">
                    {backup?.type === 'manual' ? 'Manual Export' : 'Automatic Backup'}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {formatDate(backup?.date)} • {backup?.size}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-success bg-success/10 px-2 py-1 rounded">
                  {backup?.status}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadBackup(backup?.id)}
                  iconName="Download"
                  iconPosition="left"
                >
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {backupHistory?.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            <Icon name="Archive" size={24} color="var(--color-text-secondary)" className="mx-auto mb-2" />
            <p className="text-sm">No backup history available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupSettings;