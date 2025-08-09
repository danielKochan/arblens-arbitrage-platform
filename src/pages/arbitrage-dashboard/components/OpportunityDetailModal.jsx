import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const OpportunityDetailModal = ({ opportunity, isOpen, onClose }) => {
  if (!isOpen || !opportunity) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })?.format(amount);
  };

  const formatPercentage = (value) => {
    return `${value?.toFixed(2)}%`;
  };

  const getVenueBadgeColor = (venue) => {
    const colors = {
      'Polymarket': 'bg-blue-100 text-blue-800 border-blue-200',
      'Kalshi': 'bg-green-100 text-green-800 border-green-200',
      'Betfair': 'bg-purple-100 text-purple-800 border-purple-200',
      'Manifold': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors?.[venue] || 'bg-muted text-text-secondary border-border';
  };

  const handleExternalLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
  };

  const hedgeInstructions = `1. Buy "${opportunity?.market}" on ${opportunity?.venues?.[0]?.name} at ${formatPercentage(opportunity?.venues?.[0]?.price)}
2. Sell "${opportunity?.market}" on ${opportunity?.venues?.[1]?.name} at ${formatPercentage(opportunity?.venues?.[1]?.price)}
3. Expected profit: ${formatPercentage(opportunity?.netSpread)} after fees
4. Recommended position size: $${(opportunity?.liquidity * 0.1)?.toLocaleString()}`;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-heading font-semibold text-primary">
              Arbitrage Opportunity Details
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {opportunity?.category} • Updated {new Date()?.toLocaleTimeString()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-8 h-8"
          >
            <Icon name="X" size={16} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Market Info */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-3">Market Information</h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-primary text-base leading-tight">
                {opportunity?.market}
              </h4>
              <div className="mt-2 flex items-center space-x-4 text-sm text-text-secondary">
                <span>Category: {opportunity?.category}</span>
                <span>•</span>
                <span>Confidence: {opportunity?.confidence}%</span>
                <span>•</span>
                <span>Liquidity: {formatCurrency(opportunity?.liquidity)}</span>
              </div>
            </div>
          </div>

          {/* Venue Comparison */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-3">Venue Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunity?.venues?.map((venue, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getVenueBadgeColor(venue?.name)}`}>
                      {venue?.name}
                    </span>
                    <div className="text-right">
                      <div className="text-lg font-data font-semibold text-primary">
                        {formatPercentage(venue?.price)}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {index === 0 ? 'Buy Price' : 'Sell Price'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Volume:</span>
                      <span className="font-data">{formatCurrency(venue?.volume || opportunity?.liquidity * 0.6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Fee:</span>
                      <span className="font-data">{formatPercentage(venue?.fee || 0.5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Last Update:</span>
                      <span className="font-data">2s ago</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExternalLink(index === 0 ? opportunity?.buyLink : opportunity?.sellLink)}
                    className="w-full mt-3"
                    iconName="ExternalLink"
                    iconPosition="right"
                  >
                    Trade on {venue?.name}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Profit Analysis */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-3">Profit Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                <div className="text-sm text-text-secondary">Gross Spread</div>
                <div className="text-2xl font-data font-bold text-success">
                  {formatPercentage(opportunity?.grossSpread)}
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="text-sm text-text-secondary">Net Spread</div>
                <div className="text-2xl font-data font-bold text-primary">
                  {formatPercentage(opportunity?.netSpread)}
                </div>
              </div>
              <div className="bg-muted border border-border rounded-lg p-4">
                <div className="text-sm text-text-secondary">Est. Profit (10% size)</div>
                <div className="text-2xl font-data font-bold text-primary">
                  {formatCurrency(opportunity?.liquidity * 0.1 * (opportunity?.netSpread / 100))}
                </div>
              </div>
            </div>
          </div>

          {/* Hedge Instructions */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-3">Hedge Instructions</h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <pre className="text-sm font-data text-text-primary whitespace-pre-wrap">
                {hedgeInstructions}
              </pre>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(hedgeInstructions)}
                className="mt-3"
                iconName="Copy"
                iconPosition="left"
              >
                Copy Instructions
              </Button>
            </div>
          </div>

          {/* Risk Factors */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-3">Risk Factors</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Icon name="AlertTriangle" size={16} color="var(--color-warning)" />
                <span className="text-text-secondary">Market volatility may affect pricing</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Icon name="Clock" size={16} color="var(--color-warning)" />
                <span className="text-text-secondary">Execution timing is critical for this spread</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Icon name="DollarSign" size={16} color="var(--color-warning)" />
                <span className="text-text-secondary">Consider slippage for larger position sizes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
          <div className="text-sm text-text-secondary">
            Opportunity ID: {opportunity?.id} • Expires in 15 minutes
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              variant="default"
              onClick={() => {
                copyToClipboard(hedgeInstructions);
                onClose();
              }}
              iconName="Copy"
              iconPosition="left"
            >
              Copy & Execute
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetailModal;