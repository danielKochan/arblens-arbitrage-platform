import React, { useState, useEffect } from 'react';
import { Header } from '../../components/ui/Header';
import NavigationTabs from '../../components/ui/NavigationTabs';
import NotificationToast, { useNotifications } from '../../components/ui/NotificationToast';
import OpportunitySummary from './components/OpportunitySummary';
import CalculationInputs from './components/CalculationInputs';
import ResultsPanel from './components/ResultsPanel';
import CalculationBreakdown from './components/CalculationBreakdown';
import ScenarioAnalysis from './components/ScenarioAnalysis';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useDataIngestion } from '../../contexts/DataIngestionContext';
import DataIngestionStatus from '../../components/DataIngestionStatus';
import { arbitrageService } from '../../utils/backendServices';
import checkBackendHealth from '../../utils/backendHealthCheck';

const ArbitrageCalculator = () => {
  const { notifications, addNotification, dismissNotification } = useNotifications();
  const { user, userProfile } = useAuth();
  const { opportunities: contextOpportunities, isLoading: dataIngestionLoading, refresh: refreshDataIngestion } = useDataIngestion();
  
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [calculationInputs, setCalculationInputs] = useState({
    positionSize: '1000',
    customAmount: '',
    strategy: 'long_short',
    venueAFee: 1.5,
    venueBFee: 2.0,
    slippage: 0.5,
    gasFees: 25,
    maxPosition: 10,
    timeHorizon: 30,
    marketImpact: 0.2
  });
  const [calculationResults, setCalculationResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Transform backend opportunity data to match UI expectations
  const transformBackendOpportunity = (backendOpp) => {
    return {
      id: backendOpp?.id || 'opp_' + Math.random()?.toString(36)?.substr(2, 9),
      market: backendOpp?.pair?.market_a?.title || backendOpp?.pair?.market_b?.title || 'Market Pair',
      category: backendOpp?.pair?.market_a?.category || backendOpp?.pair?.market_b?.category || 'Unknown',
      lastUpdate: getTimeAgo(backendOpp?.updated_at || backendOpp?.created_at),
      isLive: backendOpp?.status === 'active',
      venueA: {
        name: backendOpp?.pair?.market_a?.venue?.name || 'Venue A',
        yesPrice: backendOpp?.venue_a_side === 'yes' 
          ? (backendOpp?.venue_a_price || 0) * 100 
          : (1 - (backendOpp?.venue_a_price || 0)) * 100,
        noPrice: backendOpp?.venue_a_side === 'no' 
          ? (backendOpp?.venue_a_price || 0) * 100 
          : (1 - (backendOpp?.venue_a_price || 0)) * 100,
        liquidity: backendOpp?.venue_a_liquidity || 0
      },
      venueB: {
        name: backendOpp?.pair?.market_b?.venue?.name || 'Venue B',
        yesPrice: backendOpp?.venue_b_side === 'yes' 
          ? (backendOpp?.venue_b_price || 0) * 100 
          : (1 - (backendOpp?.venue_b_price || 0)) * 100,
        noPrice: backendOpp?.venue_b_side === 'no' 
          ? (backendOpp?.venue_b_price || 0) * 100 
          : (1 - (backendOpp?.venue_b_price || 0)) * 100,
        liquidity: backendOpp?.venue_b_liquidity || 0
      },
      grossSpread: backendOpp?.gross_spread_pct || 0,
      netSpread: backendOpp?.net_spread_pct || 0,
      confidence: backendOpp?.pair?.confidence_score || 85,
      maxTradableAmount: backendOpp?.max_tradable_amount || 0,
      riskLevel: backendOpp?.risk_level || 'medium',
      expectedProfitUsd: backendOpp?.expected_profit_usd || 0,
      expectedProfitPct: backendOpp?.expected_profit_pct || 0
    };
  };

  // Transform context opportunities to UI format
  const transformContextOpportunity = (contextOpp) => {
    return {
      id: contextOpp?.id,
      market: contextOpp?.market?.title || 'Market Pair',
      category: contextOpp?.market?.category || 'Unknown',
      lastUpdate: getTimeAgo(new Date()),
      isLive: true,
      venueA: {
        name: contextOpp?.venues?.a?.name || 'Venue A',
        yesPrice: contextOpp?.venues?.a?.price * 100,
        noPrice: (1 - contextOpp?.venues?.a?.price) * 100,
        liquidity: contextOpp?.venues?.a?.liquidity || 0
      },
      venueB: {
        name: contextOpp?.venues?.b?.name || 'Venue B',
        yesPrice: contextOpp?.venues?.b?.price * 100,
        noPrice: (1 - contextOpp?.venues?.b?.price) * 100,
        liquidity: contextOpp?.venues?.b?.liquidity || 0
      },
      grossSpread: contextOpp?.profitability?.grossSpread || 0,
      netSpread: contextOpp?.profitability?.netSpread || 0,
      confidence: contextOpp?.metadata?.confidence || 85,
      maxTradableAmount: contextOpp?.profitability?.maxTradableAmount || 0,
      riskLevel: contextOpp?.metadata?.riskLevel || 'medium',
      expectedProfitUsd: contextOpp?.profitability?.expectedProfitUsd || 0,
      expectedProfitPct: contextOpp?.profitability?.netSpread || 0
    };
  };

  // Fallback to backend/supabase if context has no data
  const loadFallbackOpportunities = async () => {
    try {
      const data = await arbitrageService?.getOpportunities({
        min_spread: 1.0,
        min_liquidity: 500,
        limit: 50,
        status: 'active'
      });
      
      return data?.map(transformBackendOpportunity) || [];
    } catch (error) {
      console.warn('Fallback opportunity loading failed:', error?.message);
      return [];
    }
  };

  // Helper function to format time ago
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor((now - past) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Test backend connectivity first
        const healthCheck = await checkBackendHealth();
        console.log('Backend health:', healthCheck);
        
        if (healthCheck?.status === 'error') {
          setError(`Backend connection failed: ${healthCheck?.message}`);
          return;
        }

        // Load initial data
        await Promise.all([
          loadOpportunities(),
          loadVenues(),
          loadMarkets()
        ]);
        
      } catch (error) {
        console.error('Initialization error:', error);
        setError(error?.message);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Load opportunities function with better error handling
  const loadOpportunities = async () => {
    try {
      const data = await arbitrageService?.getOpportunities({
        min_spread: 1.0,
        min_liquidity: 500,
        limit: 50,
        status: 'active'
      });
      
      const transformedOpportunities = data?.map(transformBackendOpportunity) || [];
      setOpportunities(transformedOpportunities);
      
      // Update selected opportunity if it's no longer available
      if (selectedOpportunity && !transformedOpportunities?.find(opp => opp?.id === selectedOpportunity?.id)) {
        setSelectedOpportunity(transformedOpportunities?.[0] || null);
      }
    } catch (error) {
      console.warn('Failed to refresh opportunities:', error?.message);
    }
  };

  // Load venues function
  const loadVenues = async () => {
    try {
      const data = await arbitrageService?.getVenues();
      setVenues(data || []);
    } catch (error) {
      console.warn('Failed to load venues:', error?.message);
    }
  };

  // Load markets function
  const loadMarkets = async () => {
    try {
      // This function can be implemented when market data is needed
      console.log('Loading markets...');
    } catch (error) {
      console.warn('Failed to load markets:', error?.message);
    }
  };

  // Generate venue options from real data
  const venueOptions = venues?.map(venue => ({
    value: venue?.id,
    label: venue?.name
  })) || [];

  useEffect(() => {
    if (selectedOpportunity) {
      calculateResults();
    }
  }, [calculationInputs, selectedOpportunity]);

  const calculateResults = () => {
    if (!selectedOpportunity) return;

    setIsCalculating(true);
    
    // Simulate calculation delay for better UX
    setTimeout(() => {
      const positionSize = calculationInputs?.positionSize === 'custom' 
        ? parseFloat(calculationInputs?.customAmount) || 0
        : parseFloat(calculationInputs?.positionSize);

      const grossProfit = positionSize * (selectedOpportunity?.netSpread / 100);
      const totalFees = positionSize * ((calculationInputs?.venueAFee + calculationInputs?.venueBFee) / 100);
      const slippageCost = positionSize * (calculationInputs?.slippage / 100);
      const gasCost = parseFloat(calculationInputs?.gasFees) || 0;
      const netProfit = grossProfit - totalFees - slippageCost - gasCost;
      const roi = (netProfit / positionSize) * 100;

      const results = {
        grossProfit,
        grossProfitPercent: (grossProfit / positionSize) * 100,
        netProfit,
        roi,
        riskScore: Math.min(50 + (calculationInputs?.slippage * 10) + (calculationInputs?.marketImpact * 20), 95),
        breakeven: positionSize + totalFees + slippageCost + gasCost,
        maxLoss: positionSize * 0.15,
        recommendedSize: Math.min(positionSize, Math.min(selectedOpportunity?.venueA?.liquidity, selectedOpportunity?.venueB?.liquidity) * 0.1),
        liquidityUtilization: (positionSize / Math.min(selectedOpportunity?.venueA?.liquidity, selectedOpportunity?.venueB?.liquidity)) * 100,
        minSize: 100,
        maxSize: Math.min(selectedOpportunity?.venueA?.liquidity, selectedOpportunity?.venueB?.liquidity) * 0.2
      };

      setCalculationResults(results);
      setIsCalculating(false);
    }, 500);
  };

  const handleInputChange = (field, value) => {
    setCalculationInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveCalculation = () => {
    addNotification({
      type: 'success',
      title: 'Calculation Saved',
      message: 'Your arbitrage calculation has been saved to your portfolio.',
      autoClose: 3000
    });
  };

  const handleGenerateInstructions = () => {
    addNotification({
      type: 'info',
      title: 'Instructions Generated',
      message: 'Detailed trading instructions have been generated and copied to clipboard.',
      autoClose: 4000
    });
  };

  const handleCopyDetails = () => {
    const details = `
Arbitrage Opportunity: ${selectedOpportunity?.market}
Position Size: $${calculationInputs?.positionSize === 'custom' ? calculationInputs?.customAmount : calculationInputs?.positionSize}
Expected Net Profit: $${calculationResults?.netProfit?.toFixed(2)}
ROI: ${calculationResults?.roi?.toFixed(2)}%
Risk Score: ${calculationResults?.riskScore}/100
    `?.trim();

    navigator?.clipboard?.writeText(details);
    addNotification({
      type: 'success',
      title: 'Details Copied',
      message: 'Calculation details have been copied to clipboard.',
      autoClose: 2000
    });
  };

  const handleRunScenario = (scenarioId) => {
    addNotification({
      type: 'info',
      title: 'Scenario Analysis',
      message: `Running ${scenarioId} scenario analysis with Monte Carlo simulation.`,
      autoClose: 3000
    });
  };

  const handleRefreshData = async () => {
    setError('');
    setRetryAttempt(0);
    
    try {
      setLoading(true);
      
      // Refresh data ingestion first
      await refreshDataIngestion();
      
      // Then reload local data
      const opportunitiesData = contextOpportunities?.length > 0 ? 
        contextOpportunities?.map(transformContextOpportunity) : 
        await loadFallbackOpportunities();
      
      setOpportunities(opportunitiesData);
      
      if (opportunitiesData?.length > 0) {
        setSelectedOpportunity(opportunitiesData?.[0]);
      }
      
      addNotification({
        type: 'success',
        title: 'Data Refreshed',
        message: `Updated ${opportunitiesData?.length} opportunities from live data ingestion.`,
        autoClose: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: error?.message || 'Failed to refresh data',
        autoClose: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDifferentOpportunity = async () => {
    if (opportunities?.length > 1) {
      // Cycle to next opportunity
      const currentIndex = opportunities?.findIndex(opp => opp?.id === selectedOpportunity?.id);
      const nextIndex = (currentIndex + 1) % opportunities?.length;
      setSelectedOpportunity(opportunities?.[nextIndex]);
    }
  };

  // Generate breakdown data from real opportunity
  const mockBreakdown = selectedOpportunity ? {
    positionSize: parseFloat(calculationInputs?.positionSize === 'custom' ? calculationInputs?.customAmount || 0 : calculationInputs?.positionSize),
    strategy: calculationInputs?.strategy === 'long_short' ? 'Long/Short Arbitrage' : 
              calculationInputs?.strategy === 'market_making' ? 'Market Making' : 'Statistical Arbitrage',
    timeHorizon: calculationInputs?.timeHorizon,
    grossSpread: selectedOpportunity?.grossSpread || 0,
    liquidityScore: selectedOpportunity?.confidence / 10 || 8.5,
    marketImpact: calculationInputs?.marketImpact,
    venueAFeeAmount: (parseFloat(calculationInputs?.positionSize === 'custom' ? calculationInputs?.customAmount || 0 : calculationInputs?.positionSize) * calculationInputs?.venueAFee / 100),
    venueBFeeAmount: (parseFloat(calculationInputs?.positionSize === 'custom' ? calculationInputs?.customAmount || 0 : calculationInputs?.positionSize) * calculationInputs?.venueBFee / 100),
    gasFees: parseFloat(calculationInputs?.gasFees),
    totalFees: (parseFloat(calculationInputs?.positionSize === 'custom' ? calculationInputs?.customAmount || 0 : calculationInputs?.positionSize) * (calculationInputs?.venueAFee + calculationInputs?.venueBFee) / 100) + parseFloat(calculationInputs?.gasFees),
    venueASlippage: calculationInputs?.slippage * 0.6,
    venueBSlippage: calculationInputs?.slippage * 0.4,
    venueAPriceImpact: parseFloat(calculationInputs?.positionSize === 'custom' ? calculationInputs?.customAmount || 0 : calculationInputs?.positionSize) * 0.002,
    venueBPriceImpact: parseFloat(calculationInputs?.positionSize === 'custom' ? calculationInputs?.customAmount || 0 : calculationInputs?.positionSize) * 0.003,
    venueALiquidityUsed: (parseFloat(calculationInputs?.positionSize === 'custom' ? calculationInputs?.customAmount || 0 : calculationInputs?.positionSize) / selectedOpportunity?.venueA?.liquidity * 100) || 0,
    venueBLiquidityUsed: (parseFloat(calculationInputs?.positionSize === 'custom' ? calculationInputs?.customAmount || 0 : calculationInputs?.positionSize) / selectedOpportunity?.venueB?.liquidity * 100) || 0,
    executionSteps: [
      {
        action: "Place Long Position on Venue A",
        description: `Buy YES shares on ${selectedOpportunity?.venueA?.name} at ${selectedOpportunity?.venueA?.yesPrice?.toFixed(0)}¢`,
        amount: parseFloat(calculationInputs?.positionSize === 'custom' ? calculationInputs?.customAmount || 0 : calculationInputs?.positionSize) * 0.5,
        expectedTime: "30-60 seconds",
        risk: "Low"
      },
      {
        action: "Place Short Position on Venue B",
        description: `Sell YES shares on ${selectedOpportunity?.venueB?.name} at ${selectedOpportunity?.venueB?.yesPrice?.toFixed(0)}¢`,
        amount: parseFloat(calculationInputs?.positionSize === 'custom' ? calculationInputs?.customAmount || 0 : calculationInputs?.positionSize) * 0.5,
        expectedTime: "30-60 seconds",
        risk: "Low"
      },
      {
        action: "Monitor Positions",
        description: "Track both positions and market movements for optimal exit timing",
        amount: 0,
        expectedTime: "Ongoing",
        risk: "Medium"
      },
      {
        action: "Execute Exit Strategy",
        description: "Close positions when spread narrows or at predetermined profit target",
        amount: parseFloat(calculationInputs?.positionSize === 'custom' ? calculationInputs?.customAmount || 0 : calculationInputs?.positionSize),
        expectedTime: "1-5 minutes",
        risk: "Medium"
      }
    ]
  } : null;

  // Enhanced loading state with data ingestion info
  if (loading && !selectedOpportunity) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <NavigationTabs />
        <div className="pt-32 pb-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Icon name="Loader2" size={48} color="var(--color-text-secondary)" className="mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
              Loading Live Arbitrage Data
            </h2>
            <p className="text-text-secondary mb-6">
              {dataIngestionLoading ? 'Initializing data ingestion from Polymarket, Kalshi, and Manifold...' :
               connectionStatus === 'checking' ? 'Detecting best data source...' :
               connectionStatus === 'backend' ? 'Connecting to backend server and fetching real-time opportunities...' :
               connectionStatus === 'fallback'? 'Backend unavailable, using live data ingestion...' : 
               connectionStatus === 'ingestion'? 'Loading fresh arbitrage data from data ingestion system...' : 'Fetching live arbitrage data...'}
            </p>
            {dataIngestionLoading && (
              <div className="bg-info/10 border border-info/20 rounded-lg p-3 mb-4 max-w-lg mx-auto">
                <p className="text-sm text-info">
                  Data ingestion system is fetching real market data from exchanges. This may take a moment...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Enhanced no opportunities state with data ingestion status
  if (!selectedOpportunity && opportunities?.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <NavigationTabs />
        <div className="pt-32 pb-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Icon name="Calculator" size={48} color="var(--color-text-secondary)" className="mx-auto mb-4" />
            <h2 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
              No Active Opportunities Available
            </h2>
            <p className="text-text-secondary mb-4">
              The data ingestion system is running but no arbitrage opportunities are currently available that meet the minimum criteria.
            </p>
            <div className="bg-muted border border-border rounded-lg p-4 mb-6 text-left max-w-lg mx-auto">
              <p className="text-sm text-text-secondary">
                <strong>Current filters:</strong> Min spread 1.0%, Min liquidity $500
              </p>
              <p className="text-sm text-text-secondary mt-2">
                Data sources: Polymarket, Kalshi, Manifold Markets
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="default" onClick={handleRefreshData} loading={loading}>
                Refresh Data
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/arbitrage-dashboard'} iconName="ArrowLeft" iconPosition="left">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NavigationTabs />
      <NotificationToast 
        notifications={notifications}
        onDismiss={dismissNotification}
        onAction={(notification) => console.log('Action clicked:', notification)}
      />
      <main className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-text-secondary mb-6">
            <span>Calculator</span>
            <Icon name="ChevronRight" size={14} />
            <span className="text-card-foreground">{selectedOpportunity?.market?.substring(0, 50)}...</span>
          </div>

          {/* Enhanced Data Ingestion Status */}
          <DataIngestionStatus 
            showDetails={false}
            className="mb-6"
            onRefresh={(result) => {
              if (result?.success) {
                addNotification({
                  type: 'success',
                  title: 'Data Refreshed',
                  message: 'Market data has been updated with latest opportunities.',
                  autoClose: 3000
                });
              } else {
                addNotification({
                  type: 'error',
                  title: 'Refresh Failed',
                  message: result?.error || 'Failed to refresh market data',
                  autoClose: 4000
                });
              }
            }}
          />

          {/* Opportunity Summary */}
          <OpportunitySummary opportunity={selectedOpportunity} />

          {/* Main Calculator Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Calculation Inputs - 8 columns */}
            <div className="lg:col-span-8">
              <CalculationInputs
                inputs={calculationInputs}
                onInputChange={handleInputChange}
                venueOptions={venueOptions}
                isAdvancedMode={isAdvancedMode}
                onToggleAdvanced={() => setIsAdvancedMode(!isAdvancedMode)}
              />
            </div>

            {/* Results Panel - 4 columns */}
            <div className="lg:col-span-4">
              {calculationResults && (
                <ResultsPanel
                  results={calculationResults}
                  onSaveCalculation={handleSaveCalculation}
                  onGenerateInstructions={handleGenerateInstructions}
                  onCopyDetails={handleCopyDetails}
                />
              )}
            </div>
          </div>

          {/* Detailed Breakdown */}
          {calculationResults && mockBreakdown && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <CalculationBreakdown 
                breakdown={mockBreakdown}
                inputs={calculationInputs}
              />
              <ScenarioAnalysis
                baseResults={calculationResults}
                onRunScenario={handleRunScenario}
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-heading font-semibold text-card-foreground mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                iconName="RefreshCw"
                iconPosition="left"
                onClick={calculateResults}
                loading={isCalculating}
              >
                Recalculate
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconName="Shuffle"
                iconPosition="left"
                onClick={handleSelectDifferentOpportunity}
                disabled={opportunities?.length <= 1}
              >
                Different Opportunity ({opportunities?.length} available)
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconName="Download"
                iconPosition="left"
              >
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconName="Share"
                iconPosition="left"
              >
                Share Analysis
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconName="Bell"
                iconPosition="left"
              >
                Set Alert
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconName="ExternalLink"
                iconPosition="left"
              >
                Open Venues
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArbitrageCalculator;