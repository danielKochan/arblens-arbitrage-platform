import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';



const StrategyComparison = ({ strategies }) => {
  const [selectedStrategies, setSelectedStrategies] = useState(['basic_arbitrage', 'momentum_arb']);
  const [comparisonMetric, setComparisonMetric] = useState('cumulative_return');

  const strategyColors = {
    'basic_arbitrage': 'var(--color-accent)',
    'momentum_arb': 'var(--color-success)',
    'mean_reversion': 'var(--color-warning)',
    'statistical_arb': 'var(--color-error)',
    'cross_venue': 'var(--color-secondary)'
  };

  const strategyNames = {
    'basic_arbitrage': 'Basic Arbitrage',
    'momentum_arb': 'Momentum Arb',
    'mean_reversion': 'Mean Reversion',
    'statistical_arb': 'Statistical Arb',
    'cross_venue': 'Cross Venue'
  };

  const toggleStrategy = (strategyId) => {
    setSelectedStrategies(prev => {
      if (prev?.includes(strategyId)) {
        return prev?.filter(id => id !== strategyId);
      } else if (prev?.length < 4) {
        return [...prev, strategyId];
      }
      return prev;
    });
  };

  const getComparisonData = () => {
    if (!strategies || !strategies?.length) return [];
    
    return strategies?.map(dataPoint => {
      const result = { date: dataPoint?.date };
      selectedStrategies?.forEach(strategyId => {
        if (dataPoint?.[strategyId]) {
          result[strategyId] = dataPoint?.[strategyId]?.[comparisonMetric] || 0;
        }
      });
      return result;
    });
  };

  const comparisonData = getComparisonData();

  const formatTooltipValue = (value, name) => {
    const strategyName = strategyNames?.[name] || name;
    if (comparisonMetric === 'cumulative_return' || comparisonMetric === 'drawdown') {
      return [`${(value * 100)?.toFixed(2)}%`, strategyName];
    }
    return [value?.toLocaleString(), strategyName];
  };

  const formatYAxisTick = (value) => {
    if (comparisonMetric === 'cumulative_return' || comparisonMetric === 'drawdown') {
      return `${(value * 100)?.toFixed(0)}%`;
    }
    return value?.toLocaleString();
  };

  const getStatisticalSignificance = (strategy1, strategy2) => {
    // Mock statistical significance calculation
    const returns1 = comparisonData?.map(d => d?.[strategy1] || 0);
    const returns2 = comparisonData?.map(d => d?.[strategy2] || 0);
    
    const mean1 = returns1?.reduce((sum, val) => sum + val, 0) / returns1?.length;
    const mean2 = returns2?.reduce((sum, val) => sum + val, 0) / returns2?.length;
    
    const diff = Math.abs(mean1 - mean2);
    
    if (diff > 0.05) return 'Significant';
    if (diff > 0.02) return 'Moderate';
    return 'Not Significant';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading font-semibold text-card-foreground">
          Strategy Comparison
        </h3>
        
        <div className="flex items-center space-x-2">
          <select
            value={comparisonMetric}
            onChange={(e) => setComparisonMetric(e?.target?.value)}
            className="px-3 py-1 text-xs bg-background border border-border rounded text-foreground"
          >
            <option value="cumulative_return">Cumulative Return</option>
            <option value="daily_return">Daily Return</option>
            <option value="drawdown">Drawdown</option>
            <option value="sharpe_ratio">Sharpe Ratio</option>
            <option value="trade_count">Trade Count</option>
          </select>
        </div>
      </div>
      {/* Strategy Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-card-foreground mb-3">
          Select Strategies (max 4)
        </h4>
        <div className="flex flex-wrap gap-2">
          {Object.keys(strategyNames)?.map(strategyId => (
            <button
              key={strategyId}
              onClick={() => toggleStrategy(strategyId)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors duration-150 ${
                selectedStrategies?.includes(strategyId)
                  ? 'border-accent bg-accent/10 text-accent' :'border-border bg-background text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: strategyColors?.[strategyId] }}
                />
                <span>{strategyNames?.[strategyId]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* Comparison Chart */}
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="date" 
              stroke="var(--color-text-secondary)"
              fontSize={12}
              tickFormatter={(value) => new Date(value)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              stroke="var(--color-text-secondary)"
              fontSize={12}
              tickFormatter={formatYAxisTick}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={formatTooltipValue}
              labelFormatter={(value) => new Date(value)?.toLocaleDateString()}
            />
            <Legend 
              formatter={(value) => strategyNames?.[value] || value}
            />
            {selectedStrategies?.map(strategyId => (
              <Line
                key={strategyId}
                type="monotone"
                dataKey={strategyId}
                stroke={strategyColors?.[strategyId]}
                strokeWidth={2}
                dot={false}
                name={strategyId}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Strategy Performance Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-card-foreground">Strategy</th>
              <th className="text-right py-3 px-4 font-medium text-card-foreground">Total Return</th>
              <th className="text-right py-3 px-4 font-medium text-card-foreground">Sharpe Ratio</th>
              <th className="text-right py-3 px-4 font-medium text-card-foreground">Max Drawdown</th>
              <th className="text-right py-3 px-4 font-medium text-card-foreground">Win Rate</th>
              <th className="text-right py-3 px-4 font-medium text-card-foreground">Total Trades</th>
            </tr>
          </thead>
          <tbody>
            {selectedStrategies?.map(strategyId => {
              const strategyData = {
                totalReturn: 0.156,
                sharpeRatio: 1.23,
                maxDrawdown: -0.08,
                winRate: 0.64,
                totalTrades: 1247
              };
              
              return (
                <tr key={strategyId} className="border-b border-border/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: strategyColors?.[strategyId] }}
                      />
                      <span className="font-medium text-card-foreground">
                        {strategyNames?.[strategyId]}
                      </span>
                    </div>
                  </td>
                  <td className={`py-3 px-4 text-right font-data ${
                    strategyData?.totalReturn >= 0 ? 'text-success' : 'text-error'
                  }`}>
                    {(strategyData?.totalReturn * 100)?.toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 text-right font-data text-card-foreground">
                    {strategyData?.sharpeRatio?.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-data text-error">
                    {(strategyData?.maxDrawdown * 100)?.toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 text-right font-data text-card-foreground">
                    {(strategyData?.winRate * 100)?.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right font-data text-card-foreground">
                    {strategyData?.totalTrades?.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Statistical Significance */}
      {selectedStrategies?.length >= 2 && (
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="text-sm font-medium text-card-foreground mb-3">Statistical Significance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedStrategies?.slice(0, -1)?.map((strategy1, index) => 
              selectedStrategies?.slice(index + 1)?.map(strategy2 => (
                <div key={`${strategy1}-${strategy2}`} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-card-foreground">
                      {strategyNames?.[strategy1]} vs {strategyNames?.[strategy2]}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      getStatisticalSignificance(strategy1, strategy2) === 'Significant' 
                        ? 'bg-success/20 text-success'
                        : getStatisticalSignificance(strategy1, strategy2) === 'Moderate' ?'bg-warning/20 text-warning' :'bg-muted text-text-secondary'
                    }`}>
                      {getStatisticalSignificance(strategy1, strategy2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyComparison;