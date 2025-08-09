import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const CalculationBreakdown = ({ breakdown, inputs }) => {
  const [expandedSection, setExpandedSection] = useState('summary');

  const sections = [
    {
      id: 'summary',
      title: 'Summary',
      icon: 'BarChart3'
    },
    {
      id: 'fees',
      title: 'Fee Breakdown',
      icon: 'DollarSign'
    },
    {
      id: 'slippage',
      title: 'Slippage Analysis',
      icon: 'TrendingDown'
    },
    {
      id: 'execution',
      title: 'Execution Steps',
      icon: 'List'
    }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading font-semibold text-card-foreground">
          Detailed Breakdown
        </h3>
        <div className="flex items-center space-x-2 text-xs text-text-secondary">
          <Icon name="Clock" size={14} />
          <span>Updated {new Date()?.toLocaleTimeString()}</span>
        </div>
      </div>
      <div className="space-y-4">
        {sections?.map((section) => (
          <div key={section?.id} className="border border-border rounded-lg">
            <button
              onClick={() => toggleSection(section?.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors duration-150"
            >
              <div className="flex items-center space-x-3">
                <Icon name={section?.icon} size={16} color="var(--color-primary)" />
                <span className="font-medium text-card-foreground">{section?.title}</span>
              </div>
              <Icon 
                name={expandedSection === section?.id ? "ChevronUp" : "ChevronDown"} 
                size={16} 
                color="var(--color-text-secondary)" 
              />
            </button>

            {expandedSection === section?.id && (
              <div className="border-t border-border p-4">
                {section?.id === 'summary' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-card-foreground">Position Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Position Size:</span>
                            <span className="font-medium">${breakdown?.positionSize?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Strategy:</span>
                            <span className="font-medium">{breakdown?.strategy}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Time Horizon:</span>
                            <span className="font-medium">{breakdown?.timeHorizon} minutes</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium text-card-foreground">Market Conditions</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Gross Spread:</span>
                            <span className="font-medium text-success">{breakdown?.grossSpread}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Liquidity Score:</span>
                            <span className="font-medium">{breakdown?.liquidityScore}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Market Impact:</span>
                            <span className="font-medium">{breakdown?.marketImpact}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {section?.id === 'fees' && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 text-text-secondary">Fee Type</th>
                            <th className="text-right py-2 text-text-secondary">Rate</th>
                            <th className="text-right py-2 text-text-secondary">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="space-y-2">
                          <tr className="border-b border-border/50">
                            <td className="py-2">Venue A Trading Fee</td>
                            <td className="text-right py-2">{inputs?.venueAFee}%</td>
                            <td className="text-right py-2 font-medium">${breakdown?.venueAFeeAmount?.toFixed(2)}</td>
                          </tr>
                          <tr className="border-b border-border/50">
                            <td className="py-2">Venue B Trading Fee</td>
                            <td className="text-right py-2">{inputs?.venueBFee}%</td>
                            <td className="text-right py-2 font-medium">${breakdown?.venueBFeeAmount?.toFixed(2)}</td>
                          </tr>
                          <tr className="border-b border-border/50">
                            <td className="py-2">Gas/Network Fees</td>
                            <td className="text-right py-2">Fixed</td>
                            <td className="text-right py-2 font-medium">${breakdown?.gasFees?.toFixed(2)}</td>
                          </tr>
                          <tr className="border-t border-border">
                            <td className="py-2 font-medium">Total Fees</td>
                            <td className="text-right py-2"></td>
                            <td className="text-right py-2 font-bold text-error">${breakdown?.totalFees?.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {section?.id === 'slippage' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium text-card-foreground mb-3">Venue A Impact</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Expected Slippage:</span>
                            <span className="font-medium">{breakdown?.venueASlippage}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Price Impact:</span>
                            <span className="font-medium">${breakdown?.venueAPriceImpact?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Liquidity Used:</span>
                            <span className="font-medium">{breakdown?.venueALiquidityUsed}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium text-card-foreground mb-3">Venue B Impact</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Expected Slippage:</span>
                            <span className="font-medium">{breakdown?.venueBSlippage}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Price Impact:</span>
                            <span className="font-medium">${breakdown?.venueBPriceImpact?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Liquidity Used:</span>
                            <span className="font-medium">{breakdown?.venueBLiquidityUsed}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {section?.id === 'execution' && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {breakdown?.executionSteps?.map((step, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-card-foreground">{step?.action}</h5>
                            <p className="text-sm text-text-secondary mt-1">{step?.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-text-secondary">
                              <span>Amount: ${step?.amount?.toLocaleString()}</span>
                              <span>Expected Time: {step?.expectedTime}</span>
                              {step?.risk && <span className="text-warning">Risk: {step?.risk}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalculationBreakdown;