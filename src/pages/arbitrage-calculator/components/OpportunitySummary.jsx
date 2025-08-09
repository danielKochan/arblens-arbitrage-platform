import React from 'react';
import Icon from '../../../components/AppIcon';

const OpportunitySummary = ({ opportunity }) => {
  const getSpreadColor = (spread) => {
    if (spread >= 5) return 'text-success';
    if (spread >= 2) return 'text-warning';
    return 'text-error';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-success';
    if (confidence >= 60) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="Calculator" size={20} color="var(--color-primary)" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold text-card-foreground">
              {opportunity?.market}
            </h2>
            <p className="text-sm text-text-secondary">
              {opportunity?.category} • Updated {opportunity?.lastUpdate}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${opportunity?.isLive ? 'bg-success animate-pulse' : 'bg-error'}`}></div>
          <span className="text-sm text-text-secondary">
            {opportunity?.isLive ? 'Live' : 'Stale'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Venue A</span>
            <div className="flex items-center space-x-1">
              <Icon name="ExternalLink" size={14} color="var(--color-text-secondary)" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-card-foreground">
              {opportunity?.venueA?.name}
            </p>
            <p className="text-sm text-text-secondary">
              Yes: {opportunity?.venueA?.yesPrice}¢ • No: {opportunity?.venueA?.noPrice}¢
            </p>
            <p className="text-xs text-text-secondary">
              Liquidity: ${opportunity?.venueA?.liquidity?.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Venue B</span>
            <div className="flex items-center space-x-1">
              <Icon name="ExternalLink" size={14} color="var(--color-text-secondary)" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-card-foreground">
              {opportunity?.venueB?.name}
            </p>
            <p className="text-sm text-text-secondary">
              Yes: {opportunity?.venueB?.yesPrice}¢ • No: {opportunity?.venueB?.noPrice}¢
            </p>
            <p className="text-xs text-text-secondary">
              Liquidity: ${opportunity?.venueB?.liquidity?.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Gross Spread</span>
            <Icon name="TrendingUp" size={14} color="var(--color-success)" />
          </div>
          <div className="space-y-1">
            <p className={`text-2xl font-bold ${getSpreadColor(opportunity?.grossSpread)}`}>
              {opportunity?.grossSpread?.toFixed(2)}%
            </p>
            <p className="text-xs text-text-secondary">
              Before fees & slippage
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Confidence</span>
            <Icon name="Shield" size={14} color="var(--color-text-secondary)" />
          </div>
          <div className="space-y-1">
            <p className={`text-2xl font-bold ${getConfidenceColor(opportunity?.confidence)}`}>
              {opportunity?.confidence}%
            </p>
            <p className="text-xs text-text-secondary">
              Match reliability
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunitySummary;