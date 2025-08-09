import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CategoryReturnsChart = ({ data }) => {
  const [sortBy, setSortBy] = useState('returns');
  const [showOnlyProfitable, setShowOnlyProfitable] = useState(false);

  const categoryColors = {
    'Politics': 'var(--color-accent)',
    'Sports': 'var(--color-success)',
    'Economics': 'var(--color-warning)',
    'Entertainment': 'var(--color-error)',
    'Technology': 'var(--color-secondary)',
    'Weather': 'var(--color-primary)',
    'Crypto': 'var(--color-accent)',
    'Other': 'var(--color-muted-foreground)'
  };

  const getChartData = () => {
    if (!data || !data?.length) return [];
    
    let filteredData = showOnlyProfitable 
      ? data?.filter(item => item?.totalReturn > 0)
      : data;

    return filteredData?.sort((a, b) => {
      switch (sortBy) {
        case 'returns':
          return b?.totalReturn - a?.totalReturn;
        case 'volume':
          return b?.totalVolume - a?.totalVolume;
        case 'trades':
          return b?.tradeCount - a?.tradeCount;
        case 'winRate':
          return b?.winRate - a?.winRate;
        default:
          return 0;
      }
    });
  };

  const chartData = getChartData();

  const formatTooltipValue = (value, name, props) => {
    const data = props?.payload;
    return [
      `${(value * 100)?.toFixed(2)}%`,
      'Return'
    ];
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      const data = payload?.[0]?.payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-popover-foreground">{data?.category}</p>
          <div className="space-y-1 text-sm text-text-secondary mt-2">
            <div className="flex justify-between">
              <span>Return:</span>
              <span className={`font-data ${data?.totalReturn >= 0 ? 'text-success' : 'text-error'}`}>
                {(data?.totalReturn * 100)?.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Volume:</span>
              <span className="font-data">${data?.totalVolume?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Trades:</span>
              <span className="font-data">{data?.tradeCount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Win Rate:</span>
              <span className="font-data">{(data?.winRate * 100)?.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Trade:</span>
              <span className="font-data">${data?.avgTradeSize?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading font-semibold text-card-foreground">
          Category Performance
        </h3>
        
        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e?.target?.value)}
            className="px-3 py-1 text-xs bg-background border border-border rounded text-foreground"
          >
            <option value="returns">Sort by Returns</option>
            <option value="volume">Sort by Volume</option>
            <option value="trades">Sort by Trades</option>
            <option value="winRate">Sort by Win Rate</option>
          </select>
          
          <Button
            variant={showOnlyProfitable ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyProfitable(!showOnlyProfitable)}
            iconName="Filter"
            iconPosition="left"
          >
            Profitable Only
          </Button>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="category" 
              stroke="var(--color-text-secondary)"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="var(--color-text-secondary)"
              fontSize={12}
              tickFormatter={(value) => `${(value * 100)?.toFixed(0)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalReturn" radius={[4, 4, 0, 0]}>
              {chartData?.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry?.totalReturn >= 0 ? 'var(--color-success)' : 'var(--color-error)'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Category Summary */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {chartData?.slice(0, 4)?.map((category, index) => (
            <div key={category?.category} className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColors?.[category?.category] || categoryColors?.Other }}
                  />
                  <span className="text-sm font-medium text-card-foreground">
                    {category?.category}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-data ${
                  category?.totalReturn >= 0 ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                }`}>
                  {(category?.totalReturn * 100)?.toFixed(1)}%
                </span>
              </div>
              
              <div className="space-y-1 text-xs text-text-secondary">
                <div className="flex justify-between">
                  <span>Volume:</span>
                  <span className="font-data">${(category?.totalVolume / 1000)?.toFixed(0)}K</span>
                </div>
                <div className="flex justify-between">
                  <span>Trades:</span>
                  <span className="font-data">{category?.tradeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Win Rate:</span>
                  <span className="font-data">{(category?.winRate * 100)?.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Performance Insights */}
      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="text-sm font-medium text-card-foreground mb-3">Performance Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-success/10 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Icon name="TrendingUp" size={16} color="var(--color-success)" />
              <span className="font-medium text-success">Best Performer</span>
            </div>
            <p className="text-text-secondary">
              {chartData?.length > 0 && chartData?.[0]?.category} with {(chartData?.[0]?.totalReturn * 100)?.toFixed(1)}% returns
            </p>
          </div>
          
          <div className="p-3 bg-accent/10 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Icon name="Activity" size={16} color="var(--color-accent)" />
              <span className="font-medium text-accent">Most Active</span>
            </div>
            <p className="text-text-secondary">
              {chartData?.reduce((max, cat) => cat?.tradeCount > max?.tradeCount ? cat : max, chartData?.[0] || {})?.category} with {chartData?.reduce((max, cat) => cat?.tradeCount > max?.tradeCount ? cat : max, chartData?.[0] || {})?.tradeCount} trades
            </p>
          </div>
          
          <div className="p-3 bg-warning/10 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Icon name="Target" size={16} color="var(--color-warning)" />
              <span className="font-medium text-warning">Highest Win Rate</span>
            </div>
            <p className="text-text-secondary">
              {chartData?.reduce((max, cat) => cat?.winRate > max?.winRate ? cat : max, chartData?.[0] || {})?.category} with {(chartData?.reduce((max, cat) => cat?.winRate > max?.winRate ? cat : max, chartData?.[0] || {})?.winRate * 100)?.toFixed(0)}% wins
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryReturnsChart;