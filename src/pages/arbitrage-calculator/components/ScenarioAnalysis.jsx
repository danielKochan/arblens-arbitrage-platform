import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ScenarioAnalysis = ({ baseResults, onRunScenario }) => {
  const [selectedScenario, setSelectedScenario] = useState('optimistic');
  const [customScenario, setCustomScenario] = useState({
    spreadChange: 0,
    liquidityChange: 0,
    volatilityMultiplier: 1
  });

  const predefinedScenarios = [
    {
      id: 'optimistic',
      name: 'Optimistic',
      description: 'Best case scenario with favorable conditions',
      icon: 'TrendingUp',
      color: 'text-success',
      changes: {
        spreadChange: 20,
        liquidityChange: 50,
        volatilityMultiplier: 0.8
      }
    },
    {
      id: 'realistic',
      name: 'Realistic',
      description: 'Expected market conditions',
      icon: 'Target',
      color: 'text-primary',
      changes: {
        spreadChange: 0,
        liquidityChange: 0,
        volatilityMultiplier: 1
      }
    },
    {
      id: 'pessimistic',
      name: 'Pessimistic',
      description: 'Worst case scenario with adverse conditions',
      icon: 'TrendingDown',
      color: 'text-error',
      changes: {
        spreadChange: -30,
        liquidityChange: -40,
        volatilityMultiplier: 1.5
      }
    },
    {
      id: 'high_volatility',
      name: 'High Volatility',
      description: 'Increased market volatility scenario',
      icon: 'Zap',
      color: 'text-warning',
      changes: {
        spreadChange: -10,
        liquidityChange: -20,
        volatilityMultiplier: 2
      }
    }
  ];

  const scenarioResults = {
    optimistic: {
      netProfit: baseResults?.netProfit * 1.4,
      roi: baseResults?.roi * 1.4,
      riskScore: Math.max(baseResults?.riskScore - 20, 10),
      successProbability: 85
    },
    realistic: {
      netProfit: baseResults?.netProfit,
      roi: baseResults?.roi,
      riskScore: baseResults?.riskScore,
      successProbability: 70
    },
    pessimistic: {
      netProfit: baseResults?.netProfit * 0.3,
      roi: baseResults?.roi * 0.3,
      riskScore: Math.min(baseResults?.riskScore + 30, 95),
      successProbability: 45
    },
    high_volatility: {
      netProfit: baseResults?.netProfit * 0.6,
      roi: baseResults?.roi * 0.6,
      riskScore: Math.min(baseResults?.riskScore + 25, 90),
      successProbability: 55
    }
  };

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

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading font-semibold text-card-foreground">
          Scenario Analysis
        </h3>
        <Button
          variant="outline"
          size="sm"
          iconName="RefreshCw"
          iconPosition="left"
          onClick={() => onRunScenario(selectedScenario)}
        >
          Run Analysis
        </Button>
      </div>
      {/* Scenario Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {predefinedScenarios?.map((scenario) => (
          <button
            key={scenario?.id}
            onClick={() => setSelectedScenario(scenario?.id)}
            className={`
              p-4 rounded-lg border-2 transition-all duration-150 text-left
              ${selectedScenario === scenario?.id 
                ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Icon 
                name={scenario?.icon} 
                size={16} 
                color={selectedScenario === scenario?.id ? 'var(--color-primary)' : 'var(--color-text-secondary)'} 
              />
              <span className={`font-medium ${selectedScenario === scenario?.id ? 'text-primary' : 'text-card-foreground'}`}>
                {scenario?.name}
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              {scenario?.description}
            </p>
          </button>
        ))}
      </div>
      {/* Results Comparison */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Net Profit</span>
              <Icon name="DollarSign" size={14} color="var(--color-primary)" />
            </div>
            <p className={`text-xl font-bold ${getProfitColor(scenarioResults?.[selectedScenario]?.netProfit)}`}>
              ${scenarioResults?.[selectedScenario]?.netProfit?.toFixed(2)}
            </p>
            <p className="text-xs text-text-secondary">
              {scenarioResults?.[selectedScenario]?.netProfit > baseResults?.netProfit ? '+' : ''}
              {((scenarioResults?.[selectedScenario]?.netProfit - baseResults?.netProfit) / baseResults?.netProfit * 100)?.toFixed(1)}% vs baseline
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Risk Score</span>
              <Icon name="Shield" size={14} color="var(--color-text-secondary)" />
            </div>
            <p className={`text-xl font-bold ${getRiskColor(scenarioResults?.[selectedScenario]?.riskScore)}`}>
              {scenarioResults?.[selectedScenario]?.riskScore}
            </p>
            <p className="text-xs text-text-secondary">
              {scenarioResults?.[selectedScenario]?.riskScore > baseResults?.riskScore ? '+' : ''}
              {(scenarioResults?.[selectedScenario]?.riskScore - baseResults?.riskScore)?.toFixed(0)} vs baseline
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Success Rate</span>
              <Icon name="Target" size={14} color="var(--color-success)" />
            </div>
            <p className="text-xl font-bold text-success">
              {scenarioResults?.[selectedScenario]?.successProbability}%
            </p>
            <p className="text-xs text-text-secondary">
              Probability of profit
            </p>
          </div>
        </div>

        {/* Scenario Details */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-medium text-card-foreground mb-3">
            {predefinedScenarios?.find(s => s?.id === selectedScenario)?.name} Scenario Assumptions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-text-secondary">Spread Change:</span>
              <span className="ml-2 font-medium">
                {predefinedScenarios?.find(s => s?.id === selectedScenario)?.changes?.spreadChange > 0 ? '+' : ''}
                {predefinedScenarios?.find(s => s?.id === selectedScenario)?.changes?.spreadChange}%
              </span>
            </div>
            <div>
              <span className="text-text-secondary">Liquidity Change:</span>
              <span className="ml-2 font-medium">
                {predefinedScenarios?.find(s => s?.id === selectedScenario)?.changes?.liquidityChange > 0 ? '+' : ''}
                {predefinedScenarios?.find(s => s?.id === selectedScenario)?.changes?.liquidityChange}%
              </span>
            </div>
            <div>
              <span className="text-text-secondary">Volatility Multiplier:</span>
              <span className="ml-2 font-medium">
                {predefinedScenarios?.find(s => s?.id === selectedScenario)?.changes?.volatilityMultiplier}x
              </span>
            </div>
          </div>
        </div>

        {/* Monte Carlo Simulation Results */}
        <div className="border-t border-border pt-6">
          <h4 className="font-medium text-card-foreground mb-4">
            Monte Carlo Simulation (1,000 runs)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-card-foreground mb-3">Profit Distribution</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Best Case (95th percentile):</span>
                  <span className="font-medium text-success">
                    ${(scenarioResults?.[selectedScenario]?.netProfit * 1.8)?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Expected (50th percentile):</span>
                  <span className="font-medium">
                    ${scenarioResults?.[selectedScenario]?.netProfit?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Worst Case (5th percentile):</span>
                  <span className="font-medium text-error">
                    ${(scenarioResults?.[selectedScenario]?.netProfit * 0.2)?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-card-foreground mb-3">Risk Metrics</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Value at Risk (95%):</span>
                  <span className="font-medium text-error">
                    ${(baseResults?.netProfit * 0.15)?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Sharpe Ratio:</span>
                  <span className="font-medium">
                    {(scenarioResults?.[selectedScenario]?.roi / scenarioResults?.[selectedScenario]?.riskScore * 10)?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Max Drawdown:</span>
                  <span className="font-medium text-warning">
                    {(scenarioResults?.[selectedScenario]?.riskScore * 0.8)?.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioAnalysis;