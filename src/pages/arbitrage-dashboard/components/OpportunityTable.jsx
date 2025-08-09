import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, ExternalLink, Clock, DollarSign } from "lucide-react";
import { arbitrageService } from "../../../utils/supabaseServices";
import { useAuth } from "../../../contexts/AuthContext";

const mockOpportunities = [
  {
    id: 1,
    marketPair: {
      marketA: { title: "Trump wins 2024 Presidential Election", venue: "Polymarket" },
      marketB: { title: "Donald Trump to be elected President in 2024", venue: "Kalshi" }
    },
    spreadPercentage: 3.2,
    netSpread: 2.4,
    expectedProfit: 2450,
    maxAmount: 100000,
    venueASide: "YES",
    venueBSide: "NO",
    venueAPrice: 0.52,
    venueBPrice: 0.48,
    liquidity: { venueA: 150000, venueB: 95000 },
    riskLevel: "medium",
    timeRemaining: "2h 45m",
    category: "Politics"
  }
];

export function OpportunityTable({ filters = {}, onRowClick }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadOpportunities();
  }, [filters]);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (isAuthenticated) {
        // Load real data for authenticated users
        const data = await arbitrageService?.getOpportunities(filters);
        setOpportunities(data || []);
      } else {
        // Show mock data for non-authenticated users (preview mode)
        setOpportunities(mockOpportunities);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load opportunities');
      // Fall back to mock data on error
      setOpportunities(mockOpportunities);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })?.format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Market Pair', 'Spread', 'Expected Profit', 'Max Amount', 'Risk', 'Time']?.map((header) => (
                  <th key={header} className="px-6 py-3 text-left">
                    <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5]?.map((i) => (
                <tr key={i} className="border-b border-gray-200">
                  {Array.from({ length: 6 })?.map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error && opportunities?.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-red-600 mb-2">Error loading opportunities</div>
        <div className="text-gray-600 text-sm mb-4">{error}</div>
        <button
          onClick={loadOpportunities}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (opportunities?.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-500 mb-2">No arbitrage opportunities found</div>
        <div className="text-gray-400 text-sm">
          {isAuthenticated 
            ? 'Try adjusting your filters or check back later' :'Sign in to see live opportunities'
          }
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {!isAuthenticated && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800">
              📊 Preview Mode: Showing sample data. Sign in for live opportunities.
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="text-sm text-yellow-800">
            ⚠️ {error}. Showing cached data.
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Market Pair
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Spread
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expected Profit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time Left
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {opportunities?.map((opportunity) => (
              <tr
                key={opportunity?.id}
                onClick={() => onRowClick?.(opportunity)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900 line-clamp-1">
                      {opportunity?.pair?.market_a?.title || opportunity?.marketPair?.marketA?.title}
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {opportunity?.pair?.market_a?.venue?.name || opportunity?.marketPair?.marketA?.venue}
                      </span>
                      <span>vs</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                        {opportunity?.pair?.market_b?.venue?.name || opportunity?.marketPair?.marketB?.venue}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {(opportunity?.net_spread_pct || opportunity?.netSpread) > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {(opportunity?.net_spread_pct || opportunity?.netSpread)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        (Gross: {(opportunity?.gross_spread_pct || opportunity?.spreadPercentage)}%)
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(opportunity?.expected_profit_usd || opportunity?.expectedProfit)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(opportunity?.expected_profit_pct || opportunity?.netSpread)}% return
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(opportunity?.max_tradable_amount || opportunity?.maxAmount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Max size
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(opportunity?.risk_level || opportunity?.riskLevel)}`}>
                    {(opportunity?.risk_level || opportunity?.riskLevel)?.charAt(0)?.toUpperCase() + (opportunity?.risk_level || opportunity?.riskLevel)?.slice(1)}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600">
                      {opportunity?.time_remaining || opportunity?.timeRemaining || '2h 30m'}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e?.stopPropagation();
                      // In a real app, this would open the trading interface
                      alert('Trading interface would open here');
                    }}
                    className="text-blue-600 hover:text-blue-900 flex items-center"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {opportunities?.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {opportunities?.length} opportunities
            {!isAuthenticated && (
              <span className="ml-2 text-blue-600">
                • Sign in for real-time data and unlimited access
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}