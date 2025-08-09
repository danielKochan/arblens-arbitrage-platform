import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Icon from '../../../components/AppIcon';


const VenuePerformanceBreakdown = ({ data }) => {
  const [viewType, setViewType] = useState('pie');
  const [metric, setMetric] = useState('profit');

  const venueColors = {
    'Polymarket': 'var(--color-accent)',
    'Kalshi': 'var(--color-success)',
    'Betfair': 'var(--color-warning)',
    'Manifold': 'var(--color-error)',
    'Others': 'var(--color-secondary)'
  };

  const getChartData = () => {
    if (!data || !data?.length) return [];
    
    return data?.map(venue => ({
      ...venue,
      value: metric === 'profit' ? venue?.totalProfit : 
             metric === 'volume' ? venue?.totalVolume : 
             venue?.opportunityCount
    }));
  };

  const chartData = getChartData();

  const formatTooltipValue = (value, name, props) => {
    if (metric === 'profit') {
      return [`$${value?.toLocaleString()}`, 'Profit'];
    } else if (metric === 'volume') {
      return [`$${value?.toLocaleString()}`, 'Volume'];
    }
    return [value?.toLocaleString(), 'Opportunities'];
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      const data = payload?.[0]?.payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-popover-foreground">{data?.venue}</p>
          <p className="text-sm text-text-secondary">
            {metric === 'profit' && `Profit: $${data?.totalProfit?.toLocaleString()}`}
            {metric === 'volume' && `Volume: $${data?.totalVolume?.toLocaleString()}`}
            {metric === 'opportunities' && `Opportunities: ${data?.opportunityCount?.toLocaleString()}`}
          </p>
          <p className="text-sm text-text-secondary">
            Win Rate: {(data?.winRate * 100)?.toFixed(1)}%
          </p>
          <p className="text-sm text-text-secondary">
            Avg Trade: $${data?.avgTradeSize?.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading font-semibold text-card-foreground">
          Venue Performance Breakdown
        </h3>
        
        <div className="flex items-center space-x-2">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setMetric('profit')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
                metric === 'profit' ?'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Profit
            </button>
            <button
              onClick={() => setMetric('volume')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
                metric === 'volume' ?'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Volume
            </button>
            <button
              onClick={() => setMetric('opportunities')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
                metric === 'opportunities' ?'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Count
            </button>
          </div>
          
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewType('pie')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
                viewType === 'pie' ?'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="PieChart" size={14} />
            </button>
            <button
              onClick={() => setViewType('bar')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
                viewType === 'bar' ?'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="BarChart3" size={14} />
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {viewType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ venue, percent }) => `${venue} ${(percent * 100)?.toFixed(0)}%`}
                    labelLine={false}
                  >
                    {chartData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={venueColors?.[entry?.venue] || venueColors?.Others} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis 
                    dataKey="venue" 
                    stroke="var(--color-text-secondary)"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="var(--color-text-secondary)"
                    fontSize={12}
                    tickFormatter={(value) => {
                      if (metric === 'profit' || metric === 'volume') {
                        return `$${(value / 1000)?.toFixed(0)}K`;
                      }
                      return value?.toLocaleString();
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={venueColors?.[entry?.venue] || venueColors?.Others} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Venue Stats */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-card-foreground">Venue Statistics</h4>
          {chartData?.map((venue, index) => (
            <div key={venue?.venue} className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: venueColors?.[venue?.venue] || venueColors?.Others }}
                  />
                  <span className="text-sm font-medium text-card-foreground">
                    {venue?.venue}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  venue?.winRate >= 0.6 ? 'bg-success/20 text-success' :
                  venue?.winRate >= 0.4 ? 'bg-warning/20 text-warning': 'bg-error/20 text-error'
                }`}>
                  {(venue?.winRate * 100)?.toFixed(1)}%
                </span>
              </div>
              
              <div className="space-y-1 text-xs text-text-secondary">
                <div className="flex justify-between">
                  <span>Profit:</span>
                  <span className="font-data">${venue?.totalProfit?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Volume:</span>
                  <span className="font-data">${venue?.totalVolume?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trades:</span>
                  <span className="font-data">{venue?.opportunityCount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Size:</span>
                  <span className="font-data">${venue?.avgTradeSize?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VenuePerformanceBreakdown;