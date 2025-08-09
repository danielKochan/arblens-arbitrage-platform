import React, { useState } from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { Checkbox, CheckboxGroup } from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const TradingSettings = () => {
  const [tradingPrefs, setTradingPrefs] = useState({
    defaultVenues: ['polymarket', 'kalshi'],
    riskTolerance: 'moderate',
    minSpread: '2.5',
    maxPosition: '10000',
    defaultFees: {
      polymarket: '2.0',
      kalshi: '1.5',
      betfair: '5.0',
      manifold: '0.0'
    },
    slippageAssumption: '0.5',
    autoCalculate: true,
    showGrossOnly: false,
    includeGasCosts: true,
    hedgeInstructions: true
  });

  const [isSaving, setIsSaving] = useState(false);

  const venueOptions = [
    { value: 'polymarket', label: 'Polymarket', description: 'Decentralized prediction markets' },
    { value: 'kalshi', label: 'Kalshi', description: 'CFTC-regulated event contracts' },
    { value: 'betfair', label: 'Betfair', description: 'Sports and political betting' },
    { value: 'manifold', label: 'Manifold Markets', description: 'Play-money prediction markets' }
  ];

  const riskToleranceOptions = [
    { value: 'conservative', label: 'Conservative', description: 'Lower risk, stable returns' },
    { value: 'moderate', label: 'Moderate', description: 'Balanced risk-reward approach' },
    { value: 'aggressive', label: 'Aggressive', description: 'Higher risk, maximum returns' }
  ];

  const handleSelectChange = (field, value) => {
    setTradingPrefs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputChange = (field, value) => {
    setTradingPrefs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeeChange = (venue, value) => {
    setTradingPrefs(prev => ({
      ...prev,
      defaultFees: {
        ...prev?.defaultFees,
        [venue]: value
      }
    }));
  };

  const handleCheckboxChange = (field, checked) => {
    setTradingPrefs(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleVenueSelection = (venues) => {
    setTradingPrefs(prev => ({
      ...prev,
      defaultVenues: venues
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
    } finally {
      setIsSaving(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'conservative': return 'text-success';
      case 'moderate': return 'text-warning';
      case 'aggressive': return 'text-error';
      default: return 'text-text-secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-heading font-semibold text-card-foreground">
          Trading Preferences
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          Configure default venues, risk settings, and calculation assumptions
        </p>
      </div>
      {/* Default Venues */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-heading font-medium text-card-foreground mb-4">
          Default Venues
        </h4>
        <p className="text-sm text-text-secondary mb-4">
          Select which venues to include by default in arbitrage calculations
        </p>
        
        <CheckboxGroup label="Active Venues">
          {venueOptions?.map((venue) => (
            <div key={venue?.value} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
              <Checkbox
                checked={tradingPrefs?.defaultVenues?.includes(venue?.value)}
                onChange={(e) => {
                  const isChecked = e?.target?.checked;
                  const newVenues = isChecked 
                    ? [...tradingPrefs?.defaultVenues, venue?.value]
                    : tradingPrefs?.defaultVenues?.filter(v => v !== venue?.value);
                  handleVenueSelection(newVenues);
                }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-card-foreground">
                  {venue?.label}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {venue?.description}
                </div>
              </div>
            </div>
          ))}
        </CheckboxGroup>
      </div>
      {/* Risk Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-heading font-medium text-card-foreground mb-4">
          Risk & Filtering Settings
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Risk Tolerance"
            description="Affects opportunity filtering and recommendations"
            options={riskToleranceOptions}
            value={tradingPrefs?.riskTolerance}
            onChange={(value) => handleSelectChange('riskTolerance', value)}
          />

          <Input
            label="Minimum Spread (%)"
            type="number"
            step="0.1"
            min="0"
            value={tradingPrefs?.minSpread}
            onChange={(e) => handleInputChange('minSpread', e?.target?.value)}
            description="Only show opportunities above this spread"
          />

          <Input
            label="Maximum Position Size (USD)"
            type="number"
            step="1000"
            min="0"
            value={tradingPrefs?.maxPosition}
            onChange={(e) => handleInputChange('maxPosition', e?.target?.value)}
            description="Maximum recommended position size"
          />

          <Input
            label="Slippage Assumption (%)"
            type="number"
            step="0.1"
            min="0"
            value={tradingPrefs?.slippageAssumption}
            onChange={(e) => handleInputChange('slippageAssumption', e?.target?.value)}
            description="Expected price impact for calculations"
          />
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon 
              name={tradingPrefs?.riskTolerance === 'conservative' ? 'Shield' : 
                    tradingPrefs?.riskTolerance === 'moderate' ? 'TrendingUp' : 'Zap'} 
              size={16} 
              color={tradingPrefs?.riskTolerance === 'conservative' ? 'var(--color-success)' : 
                     tradingPrefs?.riskTolerance === 'moderate' ? 'var(--color-warning)' : 'var(--color-error)'} 
            />
            <span className={`text-sm font-medium ${getRiskColor(tradingPrefs?.riskTolerance)}`}>
              {riskToleranceOptions?.find(r => r?.value === tradingPrefs?.riskTolerance)?.label} Risk Profile
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {riskToleranceOptions?.find(r => r?.value === tradingPrefs?.riskTolerance)?.description}
          </p>
        </div>
      </div>
      {/* Fee Assumptions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-heading font-medium text-card-foreground mb-4">
          Fee Assumptions (%)
        </h4>
        <p className="text-sm text-text-secondary mb-4">
          Default fee rates used for net profit calculations
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {venueOptions?.map((venue) => (
            <Input
              key={venue?.value}
              label={venue?.label}
              type="number"
              step="0.1"
              min="0"
              value={tradingPrefs?.defaultFees?.[venue?.value]}
              onChange={(e) => handleFeeChange(venue?.value, e?.target?.value)}
              description={`${venue?.label} trading fee percentage`}
            />
          ))}
        </div>
      </div>
      {/* Calculation Options */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-heading font-medium text-card-foreground mb-4">
          Calculation Options
        </h4>
        
        <div className="space-y-4">
          <Checkbox
            label="Auto-calculate Net Spreads"
            description="Automatically subtract fees and slippage from gross spreads"
            checked={tradingPrefs?.autoCalculate}
            onChange={(e) => handleCheckboxChange('autoCalculate', e?.target?.checked)}
          />
          
          <Checkbox
            label="Show Gross Spreads Only"
            description="Display gross spreads without fee deductions in main view"
            checked={tradingPrefs?.showGrossOnly}
            onChange={(e) => handleCheckboxChange('showGrossOnly', e?.target?.checked)}
          />
          
          <Checkbox
            label="Include Gas Costs (DeFi)"
            description="Factor in estimated gas costs for decentralized venues"
            checked={tradingPrefs?.includeGasCosts}
            onChange={(e) => handleCheckboxChange('includeGasCosts', e?.target?.checked)}
          />
          
          <Checkbox
            label="Generate Hedge Instructions"
            description="Provide step-by-step trading instructions for opportunities"
            checked={tradingPrefs?.hedgeInstructions}
            onChange={(e) => handleCheckboxChange('hedgeInstructions', e?.target?.checked)}
          />
        </div>
      </div>
      <div className="flex justify-end pt-4 border-t border-border">
        <Button
          variant="default"
          onClick={handleSave}
          loading={isSaving}
          iconName="Save"
          iconPosition="left"
        >
          Save Trading Settings
        </Button>
      </div>
    </div>
  );
};

export default TradingSettings;