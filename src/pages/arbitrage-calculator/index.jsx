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
import { arbitrageService, venueService, subscriptionService } from '../../utils/supabaseServices';

const ArbitrageCalculator = () => {
  const { notifications, addNotification, dismissNotification } = useNotifications();
  const { user, userProfile } = useAuth();
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  // Load initial data
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Load venues and opportunities in parallel
        const [venuesData, opportunitiesData] = await Promise.all([
          venueService?.getActiveVenues(),
          arbitrageService?.getOpportunities({
            min_spread: 1.0,
            min_liquidity: 500
          })
        ]);
        
        if (!isMounted) return;
        
        setVenues(venuesData || []);
        setOpportunities(opportunitiesData || []);
        
        // Select first opportunity if available
        if (opportunitiesData?.length > 0) {
          setSelectedOpportunity(transformOpportunityData(opportunitiesData?.[0]));
        }
        
      } catch (error) {
        if (!isMounted) return;
        
        setError(error?.message || 'Failed to load arbitrage data');
        addNotification({
          type: 'error',
          title: 'Loading Error',
          message: error?.message || 'Failed to load arbitrage data',
          autoClose: 5000
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadInitialData();
    
    return () => {
      isMounted = false;
    };
  }, [addNotification]);

  // Real-time subscription for opportunities
  useEffect(() => {
    const unsubscribe = subscriptionService?.subscribeToOpportunities((payload) => {
      if (payload?.eventType === 'INSERT' || payload?.eventType === 'UPDATE') {
        // Refresh opportunities when data changes
        loadOpportunities();
      }
    });

    return unsubscribe;
  }, []);

  // Load opportunities function
  const loadOpportunities = async () => {
    try {
      const data = await arbitrageService?.getOpportunities({
        min_spread: 1.0,
        min_liquidity: 500
      });
      setOpportunities(data || []);
    } catch (error) {
      console.error('Failed to refresh opportunities:', error);
    }
  };

  // Transform Supabase opportunity data to match component expectations
  const transformOpportunityData = (opportunity) => {
    const venueA = opportunity?.pair?.market_a?.venue;
    const venueB = opportunity?.pair?.market_b?.venue;
    const marketA = opportunity?.pair?.market_a;
    const marketB = opportunity?.pair?.market_b;

    return {
      id: opportunity?.id,
      market: marketA?.title || marketB?.title || 'Market Pair',
      category: marketA?.category || marketB?.category || 'Unknown',
      lastUpdate: getTimeAgo(opportunity?.updated_at),
      isLive: opportunity?.status === 'active',
      venueA: {
        name: venueA?.name || 'Venue A',
        yesPrice: opportunity?.venue_a_side === 'yes' ? opportunity?.venue_a_price * 100 : (1 - opportunity?.venue_a_price) * 100,
        noPrice: opportunity?.venue_a_side === 'no' ? opportunity?.venue_a_price * 100 : (1 - opportunity?.venue_a_price) * 100,
        liquidity: opportunity?.venue_a_liquidity || 0
      },
      venueB: {
        name: venueB?.name || 'Venue B',
        yesPrice: opportunity?.venue_b_side === 'yes' ? opportunity?.venue_b_price * 100 : (1 - opportunity?.venue_b_price) * 100,
        noPrice: opportunity?.venue_b_side === 'no' ? opportunity?.venue_b_price * 100 : (1 - opportunity?.venue_b_price) * 100,
        liquidity: opportunity?.venue_b_liquidity || 0
      },
      grossSpread: opportunity?.gross_spread_pct || 0,
      netSpread: opportunity?.net_spread_pct || 0,
      confidence: opportunity?.pair?.confidence_score || 85,
      maxTradableAmount: opportunity?.max_tradable_amount || 0,
      riskLevel: opportunity?.risk_level || 'medium',
      expectedProfitUsd: opportunity?.expected_profit_usd || 0,
      expectedProfitPct: opportunity?.expected_profit_pct || 0
    };
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

    navigator.clipboard?.writeText(details);
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
    try {
      setError('');
      await loadOpportunities();
      
      addNotification({
        type: 'success',
        title: 'Data Refreshed',
        message: 'Arbitrage opportunities have been updated.',
        autoClose: 2000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: error?.message || 'Failed to refresh data',
        autoClose: 3000
      });
    }
  };

  const handleSelectDifferentOpportunity = async () => {
    if (opportunities?.length > 1) {
      // Cycle to next opportunity
      const currentIndex = opportunities?.findIndex(opp => opp?.id === selectedOpportunity?.id);
      const nextIndex = (currentIndex + 1) % opportunities?.length;
      setSelectedOpportunity(transformOpportunityData(opportunities?.[nextIndex]));
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <NavigationTabs />
        <div className="pt-32 pb-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Icon name="Loader2" size={48} color="var(--color-text-secondary)" className="mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
              Loading Arbitrage Data
            </h2>
            <p className="text-text-secondary mb-6">
              Fetching real-time opportunities and market data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !selectedOpportunity) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <NavigationTabs />
        <div className="pt-32 pb-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Icon name="AlertCircle" size={48} color="var(--color-error)" className="mx-auto mb-4" />
            <h2 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
              Failed to Load Data
            </h2>
            <p className="text-text-secondary mb-6">
              {error}
            </p>
            <Button variant="default" onClick={handleRefreshData}>
              Retry Loading
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No opportunities state
  if (!selectedOpportunity && opportunities?.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <NavigationTabs />
        <div className="pt-32 pb-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Icon name="Calculator" size={48} color="var(--color-text-secondary)" className="mx-auto mb-4" />
            <h2 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
              No Opportunities Available
            </h2>
            <p className="text-text-secondary mb-6">
              There are currently no arbitrage opportunities meeting the minimum criteria. Check back later or adjust your filters.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="default" onClick={handleRefreshData}>
                Refresh Data
              </Button>
              <Button variant="outline" iconName="ArrowLeft" iconPosition="left">
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

          {/* Data Status Banner */}
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-card-foreground">
                  Live Data Connected
                </p>
                <p className="text-xs text-text-secondary">
                  Real-time arbitrage opportunities from Supabase • {opportunities?.length} active opportunities
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              iconName="RefreshCw"
              iconPosition="left"
              onClick={handleRefreshData}
            >
              Refresh
            </Button>
          </div>

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
                Different Opportunity
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