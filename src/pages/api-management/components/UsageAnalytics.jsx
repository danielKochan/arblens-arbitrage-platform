import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import UsageChart from './UsageChart';

const UsageAnalytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('requests');

  // Mock usage data
  const usageData = {
    '7d': [
      { date: '2025-01-03', requests: 1250, errors: 12 },
      { date: '2025-01-04', requests: 1890, errors: 8 },
      { date: '2025-01-05', requests: 2100, errors: 15 },
      { date: '2025-01-06', requests: 1750, errors: 6 },
      { date: '2025-01-07', requests: 2300, errors: 18 },
      { date: '2025-01-08', requests: 2850, errors: 22 },
      { date: '2025-01-09', requests: 3100, errors: 14 }
    ],
    '30d': [
      { date: '2024-12-10', requests: 45000, errors: 450 },
      { date: '2024-12-17', requests: 52000, errors: 380 },
      { date: '2024-12-24', requests: 38000, errors: 290 },
      { date: '2024-12-31', requests: 48000, errors: 420 },
      { date: '2025-01-07', requests: 55000, errors: 510 }
    ],
    '90d': [
      { date: '2024-10-15', requests: 180000, errors: 1800 },
      { date: '2024-11-15', requests: 220000, errors: 1650 },
      { date: '2024-12-15', requests: 195000, errors: 1420 },
      { date: '2025-01-09', requests: 240000, errors: 1890 }
    ]
  };

  const endpointData = [
    { endpoint: '/arbitrage/opportunities', requests: 15420 },
    { endpoint: '/markets/{id}', requests: 8930 },
    { endpoint: '/alerts', requests: 5670 },
    { endpoint: '/venues', requests: 3240 },
    { endpoint: '/historical', requests: 2180 }
  ];

  const currentData = usageData?.[timeRange];
  const totalRequests = currentData?.reduce((sum, day) => sum + day?.requests, 0);
  const totalErrors = currentData?.reduce((sum, day) => sum + day?.errors, 0);
  const errorRate = ((totalErrors / totalRequests) * 100)?.toFixed(2);

  const summaryStats = [
    {
      label: 'Total Requests',
      value: totalRequests?.toLocaleString(),
      change: '+12.5%',
      changeType: 'positive',
      icon: 'Activity'
    },
    {
      label: 'Error Rate',
      value: `${errorRate}%`,
      change: '-0.3%',
      changeType: 'positive',
      icon: 'AlertTriangle'
    },
    {
      label: 'Avg Response Time',
      value: '245ms',
      change: '-15ms',
      changeType: 'positive',
      icon: 'Clock'
    },
    {
      label: 'Active Keys',
      value: '12',
      change: '+2',
      changeType: 'positive',
      icon: 'Key'
    }
  ];

  const getChangeColor = (changeType) => {
    return changeType === 'positive' ? 'text-success' : 'text-error';
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-card-foreground font-heading">
          Usage Analytics
        </h2>
        <div className="flex space-x-2">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' }
          ]?.map((range) => (
            <Button
              key={range?.value}
              variant={timeRange === range?.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range?.value)}
            >
              {range?.label}
            </Button>
          ))}
        </div>
      </div>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats?.map((stat, index) => (
          <div key={index} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon name={stat?.icon} size={20} color="var(--color-primary)" />
              </div>
              <span className={`text-sm font-medium ${getChangeColor(stat?.changeType)}`}>
                {stat?.change}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-card-foreground">
                {stat?.value}
              </div>
              <div className="text-sm text-text-secondary">
                {stat?.label}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Volume Chart */}
        <UsageChart
          data={currentData}
          type="line"
          title="Request Volume Over Time"
          color="var(--color-primary)"
        />

        {/* Endpoint Popularity */}
        <UsageChart
          data={endpointData}
          type="bar"
          title="Most Popular Endpoints"
          color="var(--color-accent)"
        />
      </div>
      {/* Detailed Metrics Table */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4 font-heading">
          Daily Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 text-sm font-medium text-text-primary">Date</th>
                <th className="text-right py-3 text-sm font-medium text-text-primary">Requests</th>
                <th className="text-right py-3 text-sm font-medium text-text-primary">Errors</th>
                <th className="text-right py-3 text-sm font-medium text-text-primary">Error Rate</th>
                <th className="text-right py-3 text-sm font-medium text-text-primary">Avg Response</th>
              </tr>
            </thead>
            <tbody>
              {currentData?.map((day, index) => {
                const dayErrorRate = ((day?.errors / day?.requests) * 100)?.toFixed(2);
                return (
                  <tr key={index} className="border-b border-border">
                    <td className="py-3 text-sm text-card-foreground">
                      {new Date(day.date)?.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3 text-sm text-right text-card-foreground font-data">
                      {day?.requests?.toLocaleString()}
                    </td>
                    <td className="py-3 text-sm text-right text-error font-data">
                      {day?.errors}
                    </td>
                    <td className="py-3 text-sm text-right text-card-foreground font-data">
                      {dayErrorRate}%
                    </td>
                    <td className="py-3 text-sm text-right text-card-foreground font-data">
                      {Math.floor(Math.random() * 100 + 200)}ms
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Rate Limiting Status */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4 font-heading">
          Rate Limiting Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: 'Production Bot', limit: 5000, used: 3240, status: 'healthy' },
            { key: 'Development Key', limit: 1000, used: 890, status: 'healthy' },
            { key: 'Analytics Script', limit: 2000, used: 1950, status: 'warning' }
          ]?.map((key, index) => {
            const percentage = (key?.used / key?.limit) * 100;
            const getStatusColor = (status) => {
              switch (status) {
                case 'healthy':
                  return 'text-success';
                case 'warning':
                  return 'text-warning';
                case 'critical':
                  return 'text-error';
                default:
                  return 'text-text-secondary';
              }
            };

            return (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-card-foreground">{key?.key}</span>
                  <span className={`text-sm font-medium ${getStatusColor(key?.status)}`}>
                    {key?.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Usage</span>
                    <span className="text-card-foreground font-data">
                      {key?.used?.toLocaleString()} / {key?.limit?.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        percentage > 90 ? 'bg-error' :
                        percentage > 70 ? 'bg-warning' : 'bg-success'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UsageAnalytics;