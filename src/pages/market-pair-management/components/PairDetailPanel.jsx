import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PairDetailPanel = ({ selectedPair, onUpdatePair, onClose }) => {
  const [overrideReason, setOverrideReason] = useState('');
  const [confidenceAdjustment, setConfidenceAdjustment] = useState(selectedPair?.confidence || 0);
  const [isEditing, setIsEditing] = useState(false);

  if (!selectedPair) {
    return (
      <div className="h-full flex items-center justify-center bg-card border border-border rounded-lg">
        <div className="text-center">
          <Icon name="MousePointer" size={48} color="var(--color-text-secondary)" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">Select a Market Pair</h3>
          <p className="text-text-secondary">
            Choose a market pair from the table to view detailed analysis and configuration options.
          </p>
        </div>
      </div>
    );
  }

  const mockPricingHistory = [
    { time: '00:00', market1: 0.65, market2: 0.62 },
    { time: '04:00', market1: 0.67, market2: 0.64 },
    { time: '08:00', market1: 0.69, market2: 0.66 },
    { time: '12:00', market1: 0.71, market2: 0.68 },
    { time: '16:00', market1: 0.68, market2: 0.65 },
    { time: '20:00', market1: 0.70, market2: 0.67 },
    { time: '24:00', market1: 0.72, market2: 0.69 }
  ];

  const confidenceFactors = [
    { factor: 'Title Similarity', score: 95, weight: 30 },
    { factor: 'Description Match', score: 88, weight: 25 },
    { factor: 'Category Alignment', score: 100, weight: 15 },
    { factor: 'Date Proximity', score: 92, weight: 15 },
    { factor: 'Historical Correlation', score: 78, weight: 15 }
  ];

  const handleSaveOverride = () => {
    onUpdatePair(selectedPair?.id, {
      confidence: confidenceAdjustment,
      overrideReason,
      status: 'overridden',
      lastModified: new Date()?.toISOString()
    });
    setIsEditing(false);
  };

  const getConfidenceColor = (score) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="h-full bg-card border border-border rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Market Pair Analysis</h2>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={isEditing ? 'default' : 'outline'}
            onClick={() => setIsEditing(!isEditing)}
            iconName="Edit"
            iconPosition="left"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            iconName="X"
          />
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Market Information */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-text-primary">Market Information</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Market 1 */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">Market 1</span>
                <span className="px-2 py-1 text-xs font-medium rounded border bg-blue-100 text-blue-800 border-blue-200">
                  {selectedPair?.market1?.venue}
                </span>
              </div>
              <h4 className="text-sm font-medium text-text-primary mb-2">
                {selectedPair?.market1?.title}
              </h4>
              <p className="text-xs text-text-secondary mb-2">
                {selectedPair?.market1?.description}
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Current Price:</span>
                <span className="font-medium text-text-primary">${selectedPair?.market1?.price}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Volume (24h):</span>
                <span className="font-medium text-text-primary">${selectedPair?.market1?.volume}</span>
              </div>
            </div>

            {/* Market 2 */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">Market 2</span>
                <span className="px-2 py-1 text-xs font-medium rounded border bg-green-100 text-green-800 border-green-200">
                  {selectedPair?.market2?.venue}
                </span>
              </div>
              <h4 className="text-sm font-medium text-text-primary mb-2">
                {selectedPair?.market2?.title}
              </h4>
              <p className="text-xs text-text-secondary mb-2">
                {selectedPair?.market2?.description}
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Current Price:</span>
                <span className="font-medium text-text-primary">${selectedPair?.market2?.price}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Volume (24h):</span>
                <span className="font-medium text-text-primary">${selectedPair?.market2?.volume}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Confidence Analysis */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium text-text-primary">Confidence Analysis</h3>
            <span className={`text-lg font-bold ${getConfidenceColor(selectedPair?.confidence)}`}>
              {selectedPair?.confidence}%
            </span>
          </div>

          <div className="space-y-3">
            {confidenceFactors?.map((factor, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-primary">{factor?.factor}</span>
                    <span className="text-sm font-medium text-text-primary">{factor?.score}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          factor?.score >= 90 ? 'bg-success' :
                          factor?.score >= 70 ? 'bg-warning' : 'bg-error'
                        }`}
                        style={{ width: `${factor?.score}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-secondary">Weight: {factor?.weight}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing History Chart */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-text-primary">Pricing History (24h)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockPricingHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  dataKey="time" 
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="market1" 
                  stroke="var(--color-accent)" 
                  strokeWidth={2}
                  name={selectedPair?.market1?.venue}
                />
                <Line 
                  type="monotone" 
                  dataKey="market2" 
                  stroke="var(--color-success)" 
                  strokeWidth={2}
                  name={selectedPair?.market2?.venue}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Manual Override Section */}
        {isEditing && (
          <div className="space-y-4 border-t border-border pt-4">
            <h3 className="text-md font-medium text-text-primary">Manual Override</h3>
            
            <div className="space-y-4">
              <Input
                label="Confidence Adjustment"
                type="number"
                min="0"
                max="100"
                value={confidenceAdjustment}
                onChange={(e) => setConfidenceAdjustment(Number(e?.target?.value))}
                description="Manually adjust the confidence score (0-100%)"
              />

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Override Reason
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e?.target?.value)}
                  placeholder="Explain why you're overriding the algorithmic matching..."
                  className="w-full h-24 px-3 py-2 border border-border rounded-md bg-input text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="default"
                  onClick={handleSaveOverride}
                  iconName="Save"
                  iconPosition="left"
                >
                  Save Override
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Historical Performance */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-text-primary">Historical Performance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm text-text-secondary mb-1">Avg Correlation</div>
              <div className="text-lg font-semibold text-text-primary">0.87</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm text-text-secondary mb-1">Price Divergence</div>
              <div className="text-lg font-semibold text-text-primary">2.3%</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm text-text-secondary mb-1">Match Duration</div>
              <div className="text-lg font-semibold text-text-primary">15 days</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm text-text-secondary mb-1">Last Updated</div>
              <div className="text-lg font-semibold text-text-primary">2 min ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PairDetailPanel;