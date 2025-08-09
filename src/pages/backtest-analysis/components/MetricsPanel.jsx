import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricsPanel = ({ metrics }) => {
  const metricCards = [
    {
      label: 'Total Return',
      value: `${(metrics?.totalReturn * 100)?.toFixed(2)}%`,
      icon: 'TrendingUp',
      color: metrics?.totalReturn >= 0 ? 'text-success' : 'text-error',
      bgColor: metrics?.totalReturn >= 0 ? 'bg-success/10' : 'bg-error/10'
    },
    {
      label: 'Sharpe Ratio',
      value: metrics?.sharpeRatio?.toFixed(2),
      icon: 'BarChart3',
      color: metrics?.sharpeRatio >= 1 ? 'text-success' : metrics?.sharpeRatio >= 0.5 ? 'text-warning' : 'text-error',
      bgColor: metrics?.sharpeRatio >= 1 ? 'bg-success/10' : metrics?.sharpeRatio >= 0.5 ? 'bg-warning/10' : 'bg-error/10'
    },
    {
      label: 'Max Drawdown',
      value: `${(Math.abs(metrics?.maxDrawdown) * 100)?.toFixed(2)}%`,
      icon: 'TrendingDown',
      color: 'text-error',
      bgColor: 'bg-error/10'
    },
    {
      label: 'Win Rate',
      value: `${(metrics?.winRate * 100)?.toFixed(1)}%`,
      icon: 'Target',
      color: metrics?.winRate >= 0.6 ? 'text-success' : metrics?.winRate >= 0.4 ? 'text-warning' : 'text-error',
      bgColor: metrics?.winRate >= 0.6 ? 'bg-success/10' : metrics?.winRate >= 0.4 ? 'bg-warning/10' : 'bg-error/10'
    },
    {
      label: 'Total Trades',
      value: metrics?.totalTrades?.toLocaleString(),
      icon: 'Activity',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'Avg Trade Duration',
      value: `${metrics?.avgTradeDuration}h`,
      icon: 'Clock',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      label: 'Profit Factor',
      value: metrics?.profitFactor?.toFixed(2),
      icon: 'Calculator',
      color: metrics?.profitFactor >= 1.5 ? 'text-success' : metrics?.profitFactor >= 1 ? 'text-warning' : 'text-error',
      bgColor: metrics?.profitFactor >= 1.5 ? 'bg-success/10' : metrics?.profitFactor >= 1 ? 'bg-warning/10' : 'bg-error/10'
    },
    {
      label: 'Volatility',
      value: `${(metrics?.volatility * 100)?.toFixed(2)}%`,
      icon: 'Zap',
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-heading font-semibold text-card-foreground mb-6">
        Performance Metrics
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {metricCards?.map((metric, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg ${metric?.bgColor} flex items-center justify-center`}>
                <Icon name={metric?.icon} size={18} color={`var(--color-${metric?.color?.replace('text-', '')})`} />
              </div>
              <div>
                <p className="text-sm font-medium text-card-foreground">
                  {metric?.label}
                </p>
              </div>
            </div>
            <div className={`text-right ${metric?.color} font-semibold text-lg font-data`}>
              {metric?.value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="text-sm font-medium text-card-foreground mb-4">Risk Metrics</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Value at Risk (95%)</span>
            <span className="text-sm font-data text-error">-{(metrics?.var95 * 100)?.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Calmar Ratio</span>
            <span className="text-sm font-data text-card-foreground">{metrics?.calmarRatio?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Sortino Ratio</span>
            <span className="text-sm font-data text-card-foreground">{metrics?.sortinoRatio?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Beta vs Market</span>
            <span className="text-sm font-data text-card-foreground">{metrics?.beta?.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;