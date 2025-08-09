import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DashboardToolbar = ({ 
  activeFilters, 
  onRemoveFilter, 
  onClearAllFilters, 
  resultsCount, 
  isLoading, 
  onRefresh, 
  onExport,
  lastUpdated 
}) => {
  const formatLastUpdated = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return timestamp?.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getFilterDisplayName = (key, value) => {
    switch (key) {
      case 'venues':
        return `Venues: ${value?.join(', ')}`;
      case 'categories':
        return `Categories: ${value?.join(', ')}`;
      case 'minSpread':
        return `Min Spread: ${value}%`;
      case 'maxSpread':
        return `Max Spread: ${value}%`;
      case 'minLiquidity':
        return `Min Liquidity: $${value?.toLocaleString()}`;
      case 'minConfidence':
        return `Min Confidence: ${value}%`;
      case 'searchTerm':
        return `Search: "${value}"`;
      default:
        return `${key}: ${value}`;
    }
  };

  const hasActiveFilters = Object.entries(activeFilters)?.some(([key, value]) => {
    if (Array.isArray(value)) return value?.length > 0;
    if (key === 'searchTerm') return value?.trim() !== '';
    if (key === 'minSpread') return value > 0;
    if (key === 'maxSpread') return value < 100;
    if (key === 'minLiquidity') return value > 0;
    if (key === 'minConfidence') return value > 0;
    return false;
  });

  return (
    <div className="bg-background border-b border-border p-4 space-y-4">
      {/* Top Row - Results and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-heading font-semibold text-primary">
              Arbitrage Opportunities
            </h1>
            <div className="flex items-center space-x-1 text-sm text-text-secondary">
              <span>•</span>
              <span className="font-data">
                {resultsCount?.toLocaleString()} opportunities
              </span>
            </div>
          </div>
          
          {/* Live Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-success/10 border border-success/20 rounded-full">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs font-medium text-success">Live</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Last Updated */}
          <div className="text-xs text-text-secondary">
            Updated {formatLastUpdated(lastUpdated)}
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            loading={isLoading}
            iconName="RefreshCw"
            iconPosition="left"
            className="text-xs"
          >
            Refresh
          </Button>

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            iconName="Download"
            iconPosition="left"
            className="text-xs"
          >
            Export
          </Button>
        </div>
      </div>
      {/* Filter Chips */}
      {hasActiveFilters && (
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-sm text-text-secondary">Active filters:</span>
          
          {Object.entries(activeFilters)?.map(([key, value]) => {
            // Skip empty or default values
            if (Array.isArray(value) && value?.length === 0) return null;
            if (key === 'searchTerm' && value?.trim() === '') return null;
            if (key === 'minSpread' && value <= 0) return null;
            if (key === 'maxSpread' && value >= 100) return null;
            if (key === 'minLiquidity' && value <= 0) return null;
            if (key === 'minConfidence' && value <= 0) return null;

            return (
              <div
                key={key}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs"
              >
                <span className="text-primary font-medium">
                  {getFilterDisplayName(key, value)}
                </span>
                <button
                  onClick={() => onRemoveFilter(key)}
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAllFilters}
            className="text-xs text-text-secondary hover:text-text-primary ml-2"
          >
            Clear all
          </Button>
        </div>
      )}
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-text-secondary">High Confidence</div>
          <div className="text-lg font-data font-semibold text-success">
            {Math.floor(resultsCount * 0.23)}
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-text-secondary">Avg Spread</div>
          <div className="text-lg font-data font-semibold text-primary">
            3.2%
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-text-secondary">Total Volume</div>
          <div className="text-lg font-data font-semibold text-primary">
            $2.4M
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-text-secondary">Active Markets</div>
          <div className="text-lg font-data font-semibold text-primary">
            {Math.floor(resultsCount * 0.67)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardToolbar;