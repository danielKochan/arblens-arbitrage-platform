import React, { useState } from 'react';
import { useDataIngestion } from '../contexts/DataIngestionContext';
import Button from './ui/Button';
import Icon from './AppIcon';

const DataIngestionStatus = ({ 
  showDetails = false, 
  className = "",
  onRefresh = null 
}) => {
  const { 
    status, 
    isLoading, 
    refresh, 
    validateQuality, 
    performMaintenance,
    dataStats 
  } = useDataIngestion();
  
  const [isValidating, setIsValidating] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const handleRefresh = async () => {
    try {
      await refresh();
      onRefresh?.({ success: true });
    } catch (error) {
      onRefresh?.({ success: false, error: error?.message });
    }
  };

  const handleValidateQuality = async () => {
    setIsValidating(true);
    try {
      const result = await validateQuality();
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        issues: [error?.message],
        timestamp: new Date()?.toISOString()
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleMaintenance = async () => {
    setIsMaintenance(true);
    try {
      await performMaintenance();
      setValidationResult(null); // Clear previous validation
    } catch (error) {
      console.error('Maintenance failed:', error?.message);
    } finally {
      setIsMaintenance(false);
    }
  };

  const getStatusColor = () => {
    switch (status?.healthStatus) {
      case 'healthy': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': case'critical': return 'text-error';
      default: return 'text-text-secondary';
    }
  };

  const getStatusIcon = () => {
    switch (status?.healthStatus) {
      case 'healthy': return 'CheckCircle';
      case 'warning': return 'AlertTriangle';
      case 'error': case'critical': return 'XCircle';
      default: return 'Clock';
    }
  };

  const getStatusText = () => {
    switch (status?.healthStatus) {
      case 'healthy': return 'Data ingestion running smoothly';
      case 'warning': return 'Data ingestion has minor issues';
      case 'error': return 'Data ingestion error';
      case 'critical': return 'Data ingestion critical failure';
      default: return 'Checking data ingestion status...';
    }
  };

  return (
    <div className={`bg-card border border-border rounded-lg ${className}`}>
      {/* Main Status Display */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
            <Icon name={getStatusIcon()} size={20} />
            {isLoading ? (
              <Icon name="Loader2" size={16} className="animate-spin" />
            ) : (
              <div className={`w-2 h-2 rounded-full ${
                status?.healthStatus === 'healthy' ? 'bg-success animate-pulse' :
                status?.healthStatus === 'warning' ? 'bg-warning animate-pulse' :
                status?.healthStatus === 'error'|| status?.healthStatus === 'critical' ? 'bg-error' : 'bg-text-secondary'
              }`} />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-card-foreground">
              {getStatusText()}
            </p>
            {status?.lastUpdate && (
              <p className="text-xs text-text-secondary">
                Last updated: {status?.lastUpdate?.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {dataStats && (
            <div className="text-xs text-text-secondary mr-4">
              {dataStats?.activeOpportunities} opportunities • {dataStats?.activeMarkets} markets
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={isLoading}
            iconName="RefreshCw"
            iconPosition="left"
          >
            Refresh
          </Button>
          
          {showDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidateQuality}
              loading={isValidating}
              iconName="Search"
              iconPosition="left"
            >
              Validate
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {status?.error && (
        <div className="px-4 pb-4">
          <div className="bg-error/10 border border-error/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Icon name="AlertCircle" size={16} className="text-error mt-0.5 flex-shrink-0" />
              <div className="text-sm text-error">
                <p className="font-medium mb-1">Error Details:</p>
                <p>{status?.error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Status */}
      {showDetails && (
        <div className="border-t border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-card-foreground">
                {dataStats?.totalVenues || 0}
              </p>
              <p className="text-xs text-text-secondary">Active Venues</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-card-foreground">
                {dataStats?.activeMarkets || 0}
              </p>
              <p className="text-xs text-text-secondary">Active Markets</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-card-foreground">
                {dataStats?.activeOpportunities || 0}
              </p>
              <p className="text-xs text-text-secondary">Opportunities</p>
            </div>
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div className="mb-4">
              <div className={`border rounded-lg p-3 ${
                validationResult?.isValid ? 'bg-success/10 border-success/20' : 'bg-warning/10 border-warning/20'
              }`}>
                <div className="flex items-start space-x-2">
                  <Icon 
                    name={validationResult?.isValid ? 'CheckCircle' : 'AlertTriangle'} 
                    size={16} 
                    className={`mt-0.5 flex-shrink-0 ${
                      validationResult?.isValid ? 'text-success' : 'text-warning'
                    }`} 
                  />
                  <div className="text-sm">
                    <p className="font-medium mb-1">
                      Data Quality: {validationResult?.isValid ? 'Good' : 'Issues Found'}
                    </p>
                    {validationResult?.issues?.length > 0 && (
                      <ul className="list-disc list-inside space-y-1">
                        {validationResult?.issues?.map((issue, index) => (
                          <li key={index} className="text-text-secondary">{issue}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Actions */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMaintenance}
              loading={isMaintenance}
              iconName="Settings"
              iconPosition="left"
            >
              Run Maintenance
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataIngestionStatus;