import React from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const CalculationInputs = ({ 
  inputs, 
  onInputChange, 
  venueOptions, 
  isAdvancedMode, 
  onToggleAdvanced 
}) => {
  const positionSizeOptions = [
    { value: '100', label: '$100' },
    { value: '500', label: '$500' },
    { value: '1000', label: '$1,000' },
    { value: '5000', label: '$5,000' },
    { value: '10000', label: '$10,000' },
    { value: 'custom', label: 'Custom Amount' }
  ];

  const strategyOptions = [
    { value: 'long_short', label: 'Long/Short Arbitrage' },
    { value: 'market_making', label: 'Market Making' },
    { value: 'statistical', label: 'Statistical Arbitrage' }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading font-semibold text-card-foreground">
          Calculation Parameters
        </h3>
        <button
          onClick={onToggleAdvanced}
          className="flex items-center space-x-2 text-sm text-primary hover:text-primary/80 transition-colors duration-150"
        >
          <Icon name={isAdvancedMode ? "ChevronUp" : "ChevronDown"} size={16} />
          <span>{isAdvancedMode ? 'Simple' : 'Advanced'} Mode</span>
        </button>
      </div>
      <div className="space-y-6">
        {/* Basic Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Position Size"
            options={positionSizeOptions}
            value={inputs?.positionSize}
            onChange={(value) => onInputChange('positionSize', value)}
            className="w-full"
          />

          {inputs?.positionSize === 'custom' && (
            <Input
              label="Custom Amount"
              type="number"
              placeholder="Enter amount in USD"
              value={inputs?.customAmount}
              onChange={(e) => onInputChange('customAmount', e?.target?.value)}
              className="w-full"
            />
          )}

          <Select
            label="Strategy Type"
            options={strategyOptions}
            value={inputs?.strategy}
            onChange={(value) => onInputChange('strategy', value)}
            className="w-full"
          />
        </div>

        {/* Fee Structure */}
        <div className="border-t border-border pt-6">
          <h4 className="text-md font-medium text-card-foreground mb-4">
            Fee Structure
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">
                Venue A Trading Fee: {inputs?.venueAFee}%
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={inputs?.venueAFee}
                onChange={(e) => onInputChange('venueAFee', parseFloat(e?.target?.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-text-secondary">
                <span>0%</span>
                <span>5%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">
                Venue B Trading Fee: {inputs?.venueBFee}%
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={inputs?.venueBFee}
                onChange={(e) => onInputChange('venueBFee', parseFloat(e?.target?.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-text-secondary">
                <span>0%</span>
                <span>5%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Parameters */}
        {isAdvancedMode && (
          <div className="border-t border-border pt-6 space-y-6">
            <h4 className="text-md font-medium text-card-foreground">
              Advanced Parameters
            </h4>

            {/* Slippage Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">
                  Expected Slippage: {inputs?.slippage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={inputs?.slippage}
                  onChange={(e) => onInputChange('slippage', parseFloat(e?.target?.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>0%</span>
                  <span>2%</span>
                </div>
              </div>

              <Input
                label="Gas/Network Fees"
                type="number"
                placeholder="Enter gas fees in USD"
                value={inputs?.gasFees}
                onChange={(e) => onInputChange('gasFees', e?.target?.value)}
                description="Estimated blockchain transaction costs"
              />
            </div>

            {/* Risk Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Maximum Position (%)"
                type="number"
                placeholder="Enter max position percentage"
                value={inputs?.maxPosition}
                onChange={(e) => onInputChange('maxPosition', e?.target?.value)}
                description="Maximum percentage of available liquidity"
              />

              <Input
                label="Time Horizon (minutes)"
                type="number"
                placeholder="Enter time horizon"
                value={inputs?.timeHorizon}
                onChange={(e) => onInputChange('timeHorizon', e?.target?.value)}
                description="Expected time to execute both legs"
              />
            </div>

            {/* Market Impact */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">
                Market Impact Factor: {inputs?.marketImpact}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={inputs?.marketImpact}
                onChange={(e) => onInputChange('marketImpact', parseFloat(e?.target?.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-text-secondary">
                <span>0%</span>
                <span>1%</span>
              </div>
              <p className="text-xs text-text-secondary">
                Additional price impact from large orders
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculationInputs;