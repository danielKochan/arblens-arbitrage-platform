import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';



const OpportunityFrequencyChart = ({ data }) => {
  const [timeframe, setTimeframe] = useState('daily');
  const [selectedVenue, setSelectedVenue] = useState('all');

  const venues = ['all', 'Polymarket', 'Kalshi', 'Betfair', 'Manifold'];
  const colors = ['var(--color-accent)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-error)', 'var(--color-secondary)'];

  const getChartData = () => {
    if (!data || !data?.length) return [];
    
    return data?.map(item => ({
      ...item,
      opportunities: selectedVenue === 'all' ? item?.totalOpportunities : item?.[selectedVenue?.toLowerCase()] || 0
    }));
  };

  const chartData = getChartData();

  const formatTooltipValue = (value, name) => {
    return [value?.toLocaleString(), 'Opportunities'];
  };

  const getBarColor = (index) => {
    return colors?.[index % colors?.length];
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading font-semibold text-card-foreground">
          Opportunity Frequency
        </h3>
        
        <div className="flex items-center space-x-2">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setTimeframe('hourly')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
                timeframe === 'hourly' ?'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Hourly
            </button>
            <button
              onClick={() => setTimeframe('daily')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
                timeframe === 'daily' ?'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
                timeframe === 'weekly' ?'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Weekly
            </button>
          </div>
          
          <select
            value={selectedVenue}
            onChange={(e) => setSelectedVenue(e?.target?.value)}
            className="px-3 py-1 text-xs bg-background border border-border rounded text-foreground"
          >
            {venues?.map(venue => (
              <option key={venue} value={venue}>
                {venue === 'all' ? 'All Venues' : venue}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="date" 
              stroke="var(--color-text-secondary)"
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value);
                if (timeframe === 'hourly') {
                  return date?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                } else if (timeframe === 'weekly') {
                  return `Week ${Math.ceil(date?.getDate() / 7)}`;
                }
                return date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis 
              stroke="var(--color-text-secondary)"
              fontSize={12}
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
            <Bar dataKey="opportunities" radius={[4, 4, 0, 0]}>
              {chartData?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent font-data">
              {chartData?.reduce((sum, item) => sum + (item?.opportunities || 0), 0)?.toLocaleString()}
            </div>
            <div className="text-xs text-text-secondary">Total Opportunities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success font-data">
              {chartData?.length > 0 ? Math.round(chartData?.reduce((sum, item) => sum + (item?.opportunities || 0), 0) / chartData?.length) : 0}
            </div>
            <div className="text-xs text-text-secondary">Daily Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning font-data">
              {chartData?.length > 0 ? Math.max(...chartData?.map(item => item?.opportunities || 0)) : 0}
            </div>
            <div className="text-xs text-text-secondary">Peak Day</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary font-data">
              {selectedVenue === 'all' ? 'All' : selectedVenue}
            </div>
            <div className="text-xs text-text-secondary">Selected Venue</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityFrequencyChart;