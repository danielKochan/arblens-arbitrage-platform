import React, { useState } from 'react';

import Button from '../../../components/ui/Button';

const ApiDocumentation = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState('arbitrage-opportunities');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');

  const endpoints = [
    {
      id: 'arbitrage-opportunities',
      name: 'Get Arbitrage Opportunities',
      method: 'GET',
      path: '/api/v1/arbitrage/opportunities',
      description: 'Retrieve real-time arbitrage opportunities across all supported venues',
      parameters: [
        { name: 'venue', type: 'string', required: false, description: 'Filter by specific venue (polymarket, kalshi, betfair)' },
        { name: 'min_spread', type: 'number', required: false, description: 'Minimum spread percentage (0-100)' },
        { name: 'category', type: 'string', required: false, description: 'Market category filter' },
        { name: 'limit', type: 'number', required: false, description: 'Number of results (max 100)' }
      ],
      response: {
        opportunities: [
          {
            id: 'arb_001',
            pair: 'US_ELECTION_2024_TRUMP_WIN',
            venues: ['polymarket', 'kalshi'],
            spread: 3.2,
            liquidity: 50000,
            confidence: 0.95
          }
        ]
      }
    },
    {
      id: 'market-data',
      name: 'Get Market Data',
      method: 'GET',
      path: '/api/v1/markets/{market_id}',
      description: 'Fetch detailed market information and pricing data',
      parameters: [
        { name: 'market_id', type: 'string', required: true, description: 'Unique market identifier' },
        { name: 'include_history', type: 'boolean', required: false, description: 'Include historical price data' }
      ],
      response: {
        market: {
          id: 'market_123',
          title: 'US Presidential Election 2024',
          venue: 'polymarket',
          price: 0.52,
          volume: 125000,
          liquidity: 75000
        }
      }
    },
    {
      id: 'create-alert',
      name: 'Create Alert',
      method: 'POST',
      path: '/api/v1/alerts',
      description: 'Create a new arbitrage opportunity alert',
      parameters: [
        { name: 'min_spread', type: 'number', required: true, description: 'Minimum spread threshold' },
        { name: 'venues', type: 'array', required: false, description: 'Array of venue names to monitor' },
        { name: 'webhook_url', type: 'string', required: false, description: 'Webhook URL for notifications' }
      ],
      response: {
        alert: {
          id: 'alert_456',
          status: 'active',
          created_at: '2025-01-09T17:39:15Z'
        }
      }
    }
  ];

  const codeExamples = {
    javascript: {
      'arbitrage-opportunities': `const response = await fetch('https://api.arblens.com/v1/arbitrage/opportunities?min_spread=2.0', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.opportunities);`,
      'market-data': `const response = await fetch('https://api.arblens.com/v1/markets/market_123', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const market = await response.json();
console.log(market);`,
      'create-alert': `const response = await fetch('https://api.arblens.com/v1/alerts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    min_spread: 3.0,
    venues: ['polymarket', 'kalshi'],
    webhook_url: 'https://your-app.com/webhook'
  })
});

const alert = await response.json();`
    },
    python: {
      'arbitrage-opportunities': `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.arblens.com/v1/arbitrage/opportunities',
    headers=headers,
    params={'min_spread': 2.0}
)

opportunities = response.json()['opportunities']
print(opportunities)`,
      'market-data': `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.arblens.com/v1/markets/market_123',
    headers=headers
)

market = response.json()['market']
print(market)`,
      'create-alert': `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

data = {
    'min_spread': 3.0,
    'venues': ['polymarket', 'kalshi'],
    'webhook_url': 'https://your-app.com/webhook'
}

response = requests.post(
    'https://api.arblens.com/v1/alerts',
    headers=headers,
    json=data
)

alert = response.json()['alert']`
    },
    curl: {
      'arbitrage-opportunities': `curl -X GET "https://api.arblens.com/v1/arbitrage/opportunities?min_spread=2.0" \\
  -H "Authorization: Bearer YOUR_API_KEY"\ -H"Content-Type: application/json"`,
      'market-data': `curl -X GET "https://api.arblens.com/v1/markets/market_123"\ -H"Authorization: Bearer YOUR_API_KEY"\ -H"Content-Type: application/json"`,
      'create-alert': `curl -X POST "https://api.arblens.com/v1/alerts"\ -H"Authorization: Bearer YOUR_API_KEY"\ -H"Content-Type: application/json" \\
  -d '{
    "min_spread": 3.0,
    "venues": ["polymarket", "kalshi"],
    "webhook_url": "https://your-app.com/webhook"
  }'`
    }
  };

  const selectedEndpointData = endpoints?.find(e => e?.id === selectedEndpoint);

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET':
        return 'bg-success/10 text-success border-success/20';
      case 'POST':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'PUT':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'DELETE':
        return 'bg-error/10 text-error border-error/20';
      default:
        return 'bg-muted text-text-secondary border-border';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Endpoint List */}
      <div className="lg:col-span-1">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-card-foreground mb-4 font-heading">
            API Endpoints
          </h3>
          <div className="space-y-2">
            {endpoints?.map((endpoint) => (
              <button
                key={endpoint?.id}
                onClick={() => setSelectedEndpoint(endpoint?.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors duration-150 ${
                  selectedEndpoint === endpoint?.id
                    ? 'bg-primary/5 border-primary text-primary' :'bg-background border-border hover:bg-muted text-card-foreground'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{endpoint?.name}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getMethodColor(endpoint?.method)}`}>
                    {endpoint?.method}
                  </span>
                </div>
                <div className="text-xs text-text-secondary font-data">
                  {endpoint?.path}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Endpoint Details */}
      <div className="lg:col-span-2 space-y-6">
        {selectedEndpointData && (
          <>
            {/* Endpoint Header */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getMethodColor(selectedEndpointData?.method)}`}>
                  {selectedEndpointData?.method}
                </span>
                <h2 className="text-xl font-semibold text-card-foreground font-heading">
                  {selectedEndpointData?.name}
                </h2>
              </div>
              <div className="bg-muted rounded-lg p-3 mb-4">
                <code className="text-sm font-data text-text-primary">
                  {selectedEndpointData?.path}
                </code>
              </div>
              <p className="text-text-secondary">
                {selectedEndpointData?.description}
              </p>
            </div>

            {/* Parameters */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4 font-heading">
                Parameters
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-sm font-medium text-text-primary">Name</th>
                      <th className="text-left py-2 text-sm font-medium text-text-primary">Type</th>
                      <th className="text-left py-2 text-sm font-medium text-text-primary">Required</th>
                      <th className="text-left py-2 text-sm font-medium text-text-primary">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEndpointData?.parameters?.map((param, index) => (
                      <tr key={index} className="border-b border-border">
                        <td className="py-3 text-sm font-data text-text-primary">{param?.name}</td>
                        <td className="py-3 text-sm text-text-secondary">{param?.type}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            param?.required 
                              ? 'bg-error/10 text-error' :'bg-muted text-text-secondary'
                          }`}>
                            {param?.required ? 'Required' : 'Optional'}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-text-secondary">{param?.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Response Example */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4 font-heading">
                Response Example
              </h3>
              <div className="bg-muted rounded-lg p-4">
                <pre className="text-sm font-data text-text-primary overflow-x-auto">
                  {JSON.stringify(selectedEndpointData?.response, null, 2)}
                </pre>
              </div>
            </div>

            {/* Code Examples */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-card-foreground font-heading">
                  Code Examples
                </h3>
                <div className="flex space-x-2">
                  {Object.keys(codeExamples)?.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-150 ${
                        selectedLanguage === lang
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-text-secondary hover:bg-muted/80'
                      }`}
                    >
                      {lang?.charAt(0)?.toUpperCase() + lang?.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-sm font-data text-text-primary overflow-x-auto">
                    {codeExamples?.[selectedLanguage]?.[selectedEndpoint]}
                  </pre>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(codeExamples?.[selectedLanguage]?.[selectedEndpoint])}
                  iconName="Copy"
                  iconSize={14}
                  className="absolute top-2 right-2"
                >
                  Copy
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ApiDocumentation;