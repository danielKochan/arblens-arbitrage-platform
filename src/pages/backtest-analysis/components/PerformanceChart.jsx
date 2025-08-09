import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PerformanceChart = ({ data, title, height = 400 }) => {
  const [chartType, setChartType] = useState('cumulative');
  const [showDrawdown, setShowDrawdown] = useState(false);

  const formatTooltipValue = (value, name) => {
    if (name === 'Cumulative Returns' || name === 'Drawdown') {
      return [`${(value * 100)?.toFixed(2)}%`, name];
    }
    return [value?.toLocaleString(), name];
  };

  const formatYAxisTick = (value) => {
    return `${(value * 100)?.toFixed(0)}%`;
  };

  const getChartData = () => {
    switch (chartType) {
      case 'drawdown':
        return data?.map(item => ({
          ...item,
          value: item?.drawdown || 0
        }));
      case 'daily':
        return data?.map(item => ({
          ...item,
          value: item?.dailyReturn || 0
        }));
      default:
        return data?.map(item => ({
          ...item,
          value: item?.cumulativeReturn || 0
        }));
    }
  };

  const chartData = getChartData();

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading font-semibold text-card-foreground">
          {title}
        </h3>
        
        <div className="flex items-center space-x-2">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setChartType('cumulative')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
                chartType === 'cumulative' ?'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cumulative
            </button>
            <button
              onClick={() => setChartType('daily')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
                chartType === 'daily' ?'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setChartType('drawdown')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
                chartType === 'drawdown'
                  ? 'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Drawdown
            </button>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDrawdown(!showDrawdown)}
            className="w-8 h-8"
          >
            <Icon name="TrendingDown" size={16} />
          </Button>
        </div>
      </div>
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'drawdown' ? (
            <AreaChart data={chartData}>
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
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-error)"
                fill="var(--color-error)"
                fillOpacity={0.1}
                strokeWidth={2}
                name="Drawdown"
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
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
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartType === 'daily' ? 'var(--color-accent)' : 'var(--color-success)'}
                strokeWidth={2}
                dot={false}
                name={chartType === 'daily' ? 'Daily Returns' : 'Cumulative Returns'}
              />
              {showDrawdown && chartType === 'cumulative' && (
                <Line
                  type="monotone"
                  dataKey="drawdown"
                  stroke="var(--color-error)"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Drawdown"
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;