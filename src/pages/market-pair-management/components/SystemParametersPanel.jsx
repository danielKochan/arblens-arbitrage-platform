import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const SystemParametersPanel = ({ isAdmin, onUpdateParameters }) => {
  const [parameters, setParameters] = useState({
    minConfidenceThreshold: 70,
    maxPairsPerVenue: 1000,
    matchingAlgorithm: 'hybrid',
    autoApprovalThreshold: 95,
    refreshInterval: 300,
    enableAutoMatching: true,
    requireManualReview: false
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isAdmin) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-center">
          <Icon name="Lock" size={48} color="var(--color-text-secondary)" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">Admin Access Required</h3>
          <p className="text-text-secondary">
            System parameter configuration is only available to administrators.
          </p>
        </div>
      </div>
    );
  }

  const algorithmOptions = [
    { value: 'semantic', label: 'Semantic Matching', description: 'Uses NLP for text similarity' },
    { value: 'statistical', label: 'Statistical Matching', description: 'Based on price correlation' },
    { value: 'hybrid', label: 'Hybrid Approach', description: 'Combines semantic and statistical' }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateParameters(parameters);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update parameters:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setParameters({
      minConfidenceThreshold: 70,
      maxPairsPerVenue: 1000,
      matchingAlgorithm: 'hybrid',
      autoApprovalThreshold: 95,
      refreshInterval: 300,
      enableAutoMatching: true,
      requireManualReview: false
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon name="Settings2" size={20} />
          <h3 className="text-lg font-semibold text-text-primary">System Parameters</h3>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              iconName="RotateCcw"
              iconPosition="left"
            >
              Reset
            </Button>
          )}
          <Button
            size="sm"
            variant={isEditing ? 'default' : 'outline'}
            onClick={() => setIsEditing(!isEditing)}
            iconName={isEditing ? 'Save' : 'Edit'}
            iconPosition="left"
            loading={isSaving}
          >
            {isEditing ? 'Save Changes' : 'Edit Parameters'}
          </Button>
        </div>
      </div>
      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Matching Algorithm */}
        <div>
          <Select
            label="Matching Algorithm"
            description="Choose the algorithm used for market pair matching"
            options={algorithmOptions}
            value={parameters?.matchingAlgorithm}
            onChange={(value) => setParameters(prev => ({ ...prev, matchingAlgorithm: value }))}
            disabled={!isEditing}
          />
        </div>

        {/* Confidence Thresholds */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-text-primary">Confidence Thresholds</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Minimum Confidence (%)"
              type="number"
              min="0"
              max="100"
              value={parameters?.minConfidenceThreshold}
              onChange={(e) => setParameters(prev => ({ 
                ...prev, 
                minConfidenceThreshold: Number(e?.target?.value) 
              }))}
              disabled={!isEditing}
              description="Minimum confidence score for pair suggestions"
            />

            <Input
              label="Auto-Approval Threshold (%)"
              type="number"
              min="0"
              max="100"
              value={parameters?.autoApprovalThreshold}
              onChange={(e) => setParameters(prev => ({ 
                ...prev, 
                autoApprovalThreshold: Number(e?.target?.value) 
              }))}
              disabled={!isEditing}
              description="Confidence score for automatic approval"
            />
          </div>
        </div>

        {/* System Limits */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-text-primary">System Limits</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Max Pairs Per Venue"
              type="number"
              min="1"
              value={parameters?.maxPairsPerVenue}
              onChange={(e) => setParameters(prev => ({ 
                ...prev, 
                maxPairsPerVenue: Number(e?.target?.value) 
              }))}
              disabled={!isEditing}
              description="Maximum number of pairs per venue"
            />

            <Input
              label="Refresh Interval (seconds)"
              type="number"
              min="60"
              max="3600"
              value={parameters?.refreshInterval}
              onChange={(e) => setParameters(prev => ({ 
                ...prev, 
                refreshInterval: Number(e?.target?.value) 
              }))}
              disabled={!isEditing}
              description="How often to refresh market data"
            />
          </div>
        </div>

        {/* Automation Settings */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-text-primary">Automation Settings</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <div className="text-sm font-medium text-text-primary">Enable Auto-Matching</div>
                <div className="text-xs text-text-secondary">
                  Automatically suggest new market pairs based on incoming data
                </div>
              </div>
              <input
                type="checkbox"
                checked={parameters?.enableAutoMatching}
                onChange={(e) => setParameters(prev => ({ 
                  ...prev, 
                  enableAutoMatching: e?.target?.checked 
                }))}
                disabled={!isEditing}
                className="w-4 h-4 rounded border-border"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <div className="text-sm font-medium text-text-primary">Require Manual Review</div>
                <div className="text-xs text-text-secondary">
                  All pairs require manual approval before becoming active
                </div>
              </div>
              <input
                type="checkbox"
                checked={parameters?.requireManualReview}
                onChange={(e) => setParameters(prev => ({ 
                  ...prev, 
                  requireManualReview: e?.target?.checked 
                }))}
                disabled={!isEditing}
                className="w-4 h-4 rounded border-border"
              />
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="border-t border-border pt-4">
          <h4 className="text-md font-medium text-text-primary mb-3">System Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="text-xs text-text-secondary mb-1">Active Pairs</div>
              <div className="text-lg font-semibold text-text-primary">1,247</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="text-xs text-text-secondary mb-1">Pending Review</div>
              <div className="text-lg font-semibold text-warning">89</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="text-xs text-text-secondary mb-1">Processing Queue</div>
              <div className="text-lg font-semibold text-accent">23</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="text-xs text-text-secondary mb-1">Last Update</div>
              <div className="text-lg font-semibold text-success">2m ago</div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="border-t border-border pt-4 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              loading={isSaving}
              iconName="Save"
              iconPosition="left"
            >
              Save Parameters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemParametersPanel;