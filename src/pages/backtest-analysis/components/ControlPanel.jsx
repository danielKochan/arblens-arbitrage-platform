import React, { useState } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';


const ControlPanel = ({
  onAnalysisRun,
  onExport,
  isLoading,
  backtests = [],
  currentBacktest,
  onBacktestSelect,
  isAuthenticated, analysisName, selectedStrategy, selectedVenues, setAnalysisName, setSelectedStrategy
}) => {
  const [dateRange, setDateRange] = useState({
    startDate: '2024-01-01',
    endDate: '2024-08-09'
  });

  const [strategy, setStrategy] = useState('basic_arbitrage');
  const [parameters, setParameters] = useState({
    minSpread: '0.5',
    maxPosition: '10000',
    slippage: '0.1',
    fees: '0.05'
  });

  const strategyOptions = [
  { value: 'basic_arbitrage', label: 'Basic Arbitrage' },
  { value: 'momentum_arb', label: 'Momentum Arbitrage' },
  { value: 'mean_reversion', label: 'Mean Reversion' },
  { value: 'statistical_arb', label: 'Statistical Arbitrage' },
  { value: 'cross_venue', label: 'Cross-Venue Arbitrage' }];


  const handleParameterChange = (key, value) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRunAnalysis = () => {
    if (!isAuthenticated) {
      return;
    }

    const config = {
      name: analysisName || `Backtest ${new Date()?.toLocaleDateString()}`,
      dateRange: {
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate
      },
      strategy: selectedStrategy,
      parameters: {
        minSpread: parameters?.minSpread,
        maxPosition: parameters?.maxPosition,
        slippage: parameters?.slippage,
        fees: parameters?.fees
      },
      venues: selectedVenues
    };

    onAnalysisRun?.(config);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading font-semibold text-card-foreground">
          Backtest Configuration
        </h2>
        
        {/* Backtest Selection Dropdown */}
        {isAuthenticated && backtests?.length > 0 &&
        <div className="flex items-center space-x-4">
            <label className="text-sm text-text-secondary">Load Previous:</label>
            <select
            value={currentBacktest?.id || ''}
            onChange={(e) => {
              const selected = backtests?.find((b) => b?.id === e?.target?.value);
              onBacktestSelect?.(selected);
            }}
            className="px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-accent focus:border-transparent">

              <option value="">Select backtest...</option>
              {backtests?.map((backtest) =>
            <option key={backtest?.id} value={backtest?.id}>
                  {backtest?.name} ({new Date(backtest?.created_at)?.toLocaleDateString()})
                </option>
            )}
            </select>
          </div>
        }
      </div>

      {!isAuthenticated &&
      <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="Info" size={16} color="rgb(234 179 8)" />
            <span className="text-sm text-yellow-700">
              Sign in to create custom backtests and access historical arbitrage data
            </span>
          </div>
        </div>
      }

      {/* Analysis Name */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Analysis Name
          </label>
          <input
            type="text"
            value={analysisName}
            onChange={(e) => setAnalysisName(e?.target?.value)}
            placeholder="Enter analysis name..."
            disabled={!isAuthenticated}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-text-secondary focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50" />

        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Strategy Type
          </label>
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e?.target?.value)}
            disabled={!isAuthenticated}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50">

            <option value="basic_arbitrage">Basic Arbitrage</option>
            <option value="momentum_arb">Momentum Arbitrage</option>
            <option value="mean_reversion">Mean Reversion</option>
            <option value="statistical_arb">Statistical Arbitrage</option>
          </select>
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={dateRange?.startDate}
            onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e?.target?.value }))}
            disabled={!isAuthenticated}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50" />

        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            End Date
          </label>
          <input
            type="date"
            value={dateRange?.endDate}
            onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e?.target?.value }))}
            disabled={!isAuthenticated}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50" />

        </div>
      </div>

      {/* Strategy Selection */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-card-foreground">Strategy</h3>
        <Select
          label="Strategy Type"
          options={strategyOptions}
          value={strategy}
          onChange={setStrategy} />

        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-text-secondary">
            {strategy === 'basic_arbitrage' && 'Simple price difference arbitrage across venues'}
            {strategy === 'momentum_arb' && 'Momentum-based arbitrage with trend following'}
            {strategy === 'mean_reversion' && 'Mean reversion strategy for price convergence'}
            {strategy === 'statistical_arb' && 'Statistical arbitrage using correlation models'}
            {strategy === 'cross_venue' && 'Cross-venue arbitrage with liquidity optimization'}
          </p>
        </div>
      </div>

      {/* Parameters */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-card-foreground">Parameters</h3>
        <Input
          label="Min Spread (%)"
          type="number"
          step="0.1"
          value={parameters?.minSpread}
          onChange={(e) => handleParameterChange('minSpread', e?.target?.value)} />

        <Input
          label="Max Position ($)"
          type="number"
          value={parameters?.maxPosition}
          onChange={(e) => handleParameterChange('maxPosition', e?.target?.value)} />

      </div>

      {/* Risk Parameters */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-card-foreground">Risk Controls</h3>
        <Input
          label="Slippage (%)"
          type="number"
          step="0.01"
          value={parameters?.slippage}
          onChange={(e) => handleParameterChange('slippage', e?.target?.value)} />

        <Input
          label="Trading Fees (%)"
          type="number"
          step="0.01"
          value={parameters?.fees}
          onChange={(e) => handleParameterChange('fees', e?.target?.value)} />

      </div>

      {/* Quick Presets */}
      <div className="mt-6 pt-6 border-t border-border">
        <h3 className="text-sm font-medium text-card-foreground mb-3">Quick Presets</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setParameters({
                minSpread: '0.3',
                maxPosition: '5000',
                slippage: '0.05',
                fees: '0.03'
              });
            }}>

            Conservative
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setParameters({
                minSpread: '0.5',
                maxPosition: '10000',
                slippage: '0.1',
                fees: '0.05'
              });
            }}>

            Balanced
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setParameters({
                minSpread: '0.8',
                maxPosition: '25000',
                slippage: '0.2',
                fees: '0.08'
              });
            }}>

            Aggressive
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <div className="flex items-center space-x-4">
          {isAuthenticated && backtests?.length > 0 &&
          <span className="text-sm text-text-secondary">
              {backtests?.length} saved backtest{backtests?.length !== 1 ? 's' : ''}
            </span>
          }
        </div>

        <div className="flex items-center space-x-3">
          {currentBacktest &&
          <Button
            variant="outline"
            onClick={onExport}
            disabled={isLoading || !isAuthenticated}
            iconName="Download"
            iconPosition="left">

              Export Results
            </Button>
          }
          
          <Button
            variant="default"
            onClick={handleRunAnalysis}
            disabled={isLoading || !isAuthenticated}
            iconName={isLoading ? "Loader2" : "Play"}
            iconPosition="left"
            className={isLoading ? "animate-spin" : ""}>

            {isLoading ? "Running..." : "Run Analysis"}
          </Button>
        </div>
      </div>
    </div>);

};

export default ControlPanel;