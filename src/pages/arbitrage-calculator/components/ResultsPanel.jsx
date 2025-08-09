import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ResultsPanel = ({ results, onSaveCalculation, onGenerateInstructions, onCopyDetails }) => {
  const getProfitColor = (profit) => {
    if (profit > 0) return 'text-success';
    if (profit < 0) return 'text-error';
    return 'text-text-secondary';
  };

  const getRiskColor = (risk) => {
    if (risk <= 30) return 'text-success';
    if (risk <= 60) return 'text-warning';
    return 'text-error';
  };

  const getRiskBgColor = (risk) => {
    if (risk <= 30) return 'bg-success/20';
    if (risk <= 60) return 'bg-warning/20';
    return 'bg-error/20';
  };

  return (
    <div className="space-y-6">
      {/* Profit Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold text-card-foreground">
            Profit Analysis
          </h3>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-xs text-text-secondary">Live</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Gross Profit</span>
              <Icon name="TrendingUp" size={14} color="var(--color-success)" />
            </div>
            <p className={`text-2xl font-bold ${getProfitColor(results?.grossProfit)}`}>
              ${results?.grossProfit?.toFixed(2)}
            </p>
            <p className="text-xs text-text-secondary">
              {results?.grossProfitPercent?.toFixed(2)}% return
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Net Profit</span>
              <Icon name="DollarSign" size={14} color="var(--color-primary)" />
            </div>
            <p className={`text-2xl font-bold ${getProfitColor(results?.netProfit)}`}>
              ${results?.netProfit?.toFixed(2)}
            </p>
            <p className="text-xs text-text-secondary">
              After all fees & costs
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">ROI</span>
              <Icon name="Percent" size={14} color="var(--color-text-secondary)" />
            </div>
            <p className={`text-2xl font-bold ${getProfitColor(results?.roi)}`}>
              {results?.roi?.toFixed(2)}%
            </p>
            <p className="text-xs text-text-secondary">
              Return on investment
            </p>
          </div>
        </div>
      </div>
      {/* Risk Assessment */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-heading font-semibold text-card-foreground mb-4">
          Risk Assessment
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Risk Score</span>
              <span className={`text-sm font-medium ${getRiskColor(results?.riskScore)}`}>
                {results?.riskScore}/100
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getRiskBgColor(results?.riskScore)}`}
                style={{ width: `${results?.riskScore}%` }}
              ></div>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {results?.riskScore <= 30 ? 'Low Risk' : 
               results?.riskScore <= 60 ? 'Medium Risk' : 'High Risk'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-text-secondary">Breakeven</p>
              <p className="text-sm font-medium text-card-foreground">
                ${results?.breakeven?.toFixed(2)}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-text-secondary">Max Loss</p>
              <p className="text-sm font-medium text-error">
                ${results?.maxLoss?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Position Sizing */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-heading font-semibold text-card-foreground mb-4">
          Optimal Sizing
        </h3>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Recommended Size</span>
              <Icon name="Target" size={14} color="var(--color-primary)" />
            </div>
            <p className="text-xl font-bold text-card-foreground">
              ${results?.recommendedSize?.toLocaleString()}
            </p>
            <p className="text-xs text-text-secondary">
              {results?.liquidityUtilization?.toFixed(1)}% of available liquidity
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-text-secondary">Min Size</p>
              <p className="text-sm font-medium text-card-foreground">
                ${results?.minSize?.toLocaleString()}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-text-secondary">Max Size</p>
              <p className="text-sm font-medium text-card-foreground">
                ${results?.maxSize?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          variant="default"
          fullWidth
          iconName="Save"
          iconPosition="left"
          onClick={onSaveCalculation}
        >
          Save Calculation
        </Button>

        <Button
          variant="outline"
          fullWidth
          iconName="FileText"
          iconPosition="left"
          onClick={onGenerateInstructions}
        >
          Generate Instructions
        </Button>

        <Button
          variant="ghost"
          fullWidth
          iconName="Copy"
          iconPosition="left"
          onClick={onCopyDetails}
        >
          Copy Details
        </Button>
      </div>
    </div>
  );
};

export default ResultsPanel;