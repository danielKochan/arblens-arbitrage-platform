import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '../../components/ui/Header';
import NavigationTabs from '../../components/ui/NavigationTabs';
import NotificationToast, { useNotifications } from '../../components/ui/NotificationToast';
import FilterSidebar from './components/FilterSidebar';
import DashboardToolbar from './components/DashboardToolbar';
import { OpportunityTable } from './components/OpportunityTable';
import OpportunityDetailModal from './components/OpportunityDetailModal';
import { arbitrageService } from '../../utils/backendServices';

import { useAuth } from '../../contexts/AuthContext';
import { useDataIngestion } from '../../contexts/DataIngestionContext';
import DataIngestionStatus from '../../components/DataIngestionStatus';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

// Mock venue service for demonstration
const venueService = {
  getActiveVenues: async () => {
    return [
      { id: 1, name: 'Venue A' },
      { id: 2, name: 'Venue B' }
    ];
  }
};

const ArbitrageDashboard = () => {
  const { user, userProfile } = useAuth();
  const { notifications, addNotification, dismissNotification } = useNotifications();
  const { opportunities: liveOpportunities, isLoading: dataIngestionLoading, refresh: refreshDataIngestion, dataStats } = useDataIngestion();
  const [isFilterSidebarCollapsed, setIsFilterSidebarCollapsed] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [sortConfig, setSortConfig] = useState({ key: 'netSpread', direction: 'desc' });
  const [opportunities, setOpportunities] = useState([]);
  const [error, setError] = useState('');
  const [availableVenues, setAvailableVenues] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('initial');
  const [filters, setFilters] = useState({
    venues: [],
    categories: [],
    minSpread: 0,
    maxSpread: 100,
    minLiquidity: 0,
    minConfidence: 0,
    searchTerm: ''
  });

  const { opportunities: filteredOpportunities, isLoading: filteredOpportunitiesLoading } = useMemo(() => {
    return {
      opportunities: opportunities,
      isLoading: isLoading
    };
  }, [opportunities, isLoading]);

  const [statistics, setStatistics] = useState({
    averageSpread: 0,
    totalLiquidity: 0
  });

  // Update statistics function
  const updateStatistics = (opportunitiesData) => {
    if (!opportunitiesData || opportunitiesData.length === 0) {
      setStatistics({ averageSpread: 0, totalLiquidity: 0 });
      return;
    }
    
    const avgSpread = opportunitiesData.reduce((sum, opp) => sum + (opp?.netSpread || 0), 0) / opportunitiesData.length;
    const totalLiq = opportunitiesData.reduce((sum, opp) => sum + (opp?.liquidity || 0), 0);
    
    setStatistics({
      averageSpread: avgSpread,
      totalLiquidity: totalLiq
    });
  };

  // Transform live opportunities from data ingestion context
  const transformLiveOpportunity = (liveOpp) => {
    return {
      id: liveOpp?.id,
      market: liveOpp?.market?.title || 'Unknown Market',
      category: liveOpp?.market?.category || 'Other',
      venueA: liveOpp?.venues?.a?.name || 'Venue A',
      venueB: liveOpp?.venues?.b?.name || 'Venue B',
      spread: liveOpp?.profitability?.netSpread || 0,
      expectedReturn: liveOpp?.profitability?.expectedProfitUsd || 0,
      liquidity: Math.min(liveOpp?.venues?.a?.liquidity || 0, liveOpp?.venues?.b?.liquidity || 0),
      riskLevel: liveOpp?.metadata?.riskLevel || 'medium',
      confidence: liveOpp?.metadata?.confidence || 70,
      lastUpdated: liveOpp?.metadata?.updatedAt || new Date()?.toISOString(),
      isLive: true
    };
  };

  // Transform Supabase opportunity data to match UI expectations
  const transformSupabaseOpportunity = (supabaseOpp) => {
    return {
      id: supabaseOpp?.id || 'opp_' + Math.random()?.toString(36)?.substr(2, 9),
      market: supabaseOpp?.pair?.market_a?.title || supabaseOpp?.pair?.market_b?.title || 'Market Pair',
      category: supabaseOpp?.pair?.market_a?.category || supabaseOpp?.pair?.market_b?.category || 'Unknown',
      venues: [
        { 
          name: supabaseOpp?.pair?.market_a?.venue?.name || 'Venue A', 
          price: (supabaseOpp?.venue_a_price || 0) * 100, 
          volume: supabaseOpp?.venue_a_liquidity || 0, 
          fee: 0.02 // Default 2% fee
        },
        { 
          name: supabaseOpp?.pair?.market_b?.venue?.name || 'Venue B', 
          price: (supabaseOpp?.venue_b_price || 0) * 100, 
          volume: supabaseOpp?.venue_b_liquidity || 0, 
          fee: 0.02 // Default 2% fee
        }
      ],
      grossSpread: supabaseOpp?.gross_spread_pct || 0,
      netSpread: supabaseOpp?.net_spread_pct || 0,
      liquidity: supabaseOpp?.max_tradable_amount || 0,
      confidence: supabaseOpp?.pair?.confidence_score || 85,
      isNew: new Date(supabaseOpp?.created_at || Date.now()) > new Date(Date.now() - 300000), // 5 minutes
      buyLink: '#', // No direct links available
      sellLink: '#'
    };
  };

  // Transform backend opportunity data to match UI expectations
  const transformBackendOpportunity = (backendOpp) => {
    return {
      id: backendOpp?.id || 'opp_' + Math.random()?.toString(36)?.substr(2, 9),
      market: backendOpp?.market || 'Market Pair',
      category: backendOpp?.category || 'Unknown',
      venues: backendOpp?.venues || [
        { name: 'Venue A', price: 0, volume: 0, fee: 0.02 },
        { name: 'Venue B', price: 0, volume: 0, fee: 0.02 }
      ],
      grossSpread: backendOpp?.gross_spread || 0,
      netSpread: backendOpp?.net_spread || 0,
      liquidity: backendOpp?.liquidity || 0,
      confidence: backendOpp?.confidence || 85,
      isNew: new Date(backendOpp?.created_at || Date.now()) > new Date(Date.now() - 300000),
      buyLink: backendOpp?.buy_link || '#',
      sellLink: backendOpp?.sell_link || '#'
    };
  };

  // Handle refresh with improved fallback
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      
      // Refresh the data ingestion system first
      await refreshDataIngestion();
      
      addNotification({
        type: 'success',
        title: 'Data Refreshed',
        message: `Market data updated. Found ${liveOpportunities?.length} live opportunities.`,
        autoClose: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: error?.message || 'Failed to refresh market data',
        autoClose: 4000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced data loading with live data ingestion
  useEffect(() => {
    let isMounted = true;
    
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Load venues first
        const venuesData = await venueService?.getActiveVenues();
        if (isMounted) {
          setAvailableVenues(venuesData || []);
        }

        // Use live opportunities from data ingestion context
        let opportunitiesData = [];
        
        if (liveOpportunities?.length > 0) {
          // Transform live opportunities to dashboard format
          opportunitiesData = liveOpportunities?.map(transformLiveOpportunity);
          setConnectionStatus('live_ingestion');
        } else {
          // Fallback to backend/supabase
          const backendData = await arbitrageService?.getOpportunities({
            min_spread: filters?.minSpread || 0.5,
            min_liquidity: filters?.minLiquidity || 100,
            venues: filters?.selectedVenues?.length > 0 ? filters?.selectedVenues : undefined,
            category: filters?.category || undefined,
            limit: 100
          });
          
          opportunitiesData = backendData?.map(transformBackendOpportunity) || [];
          setConnectionStatus('backend_fallback');
        }

        if (isMounted) {
          setOpportunities(opportunitiesData);
          updateStatistics(opportunitiesData);
        }

      } catch (error) {
        if (!isMounted) return;
        
        setError(error?.message || 'Failed to load dashboard data');
        addNotification({
          type: 'error',
          title: 'Data Loading Error',
          message: error?.message || 'Failed to load arbitrage data',
          autoClose: 5000
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();
    
    return () => {
      isMounted = false;
    };
  }, [liveOpportunities, filters, addNotification]);

  // Filter and sort opportunities
  const filteredAndSortedOpportunities = useMemo(() => {
    let filtered = opportunities?.filter(opportunity => {
      // Venue filter
      if (filters?.venues?.length > 0) {
        const hasMatchingVenue = opportunity?.venues?.some(venue => 
          filters?.venues?.includes(venue?.name?.toLowerCase())
        );
        if (!hasMatchingVenue) return false;
      }

      // Category filter
      if (filters?.categories?.length > 0) {
        if (!filters?.categories?.includes(opportunity?.category?.toLowerCase())) return false;
      }

      // Spread filters
      if (opportunity?.netSpread < filters?.minSpread || opportunity?.netSpread > filters?.maxSpread) {
        return false;
      }

      // Liquidity filter
      if (opportunity?.liquidity < filters?.minLiquidity) return false;

      // Confidence filter
      if (opportunity?.confidence < filters?.minConfidence) return false;

      // Search filter
      if (filters?.searchTerm?.trim()) {
        const searchLower = filters?.searchTerm?.toLowerCase();
        return opportunity?.market?.toLowerCase()?.includes(searchLower) ||
               opportunity?.category?.toLowerCase()?.includes(searchLower);
      }

      return true;
    });

    // Sort opportunities
    filtered?.sort((a, b) => {
      let aValue = a?.[sortConfig?.key];
      let bValue = b?.[sortConfig?.key];

      if (sortConfig?.key === 'market') {
        aValue = a?.market?.toLowerCase();
        bValue = b?.market?.toLowerCase();
      } else if (sortConfig?.key === 'venues') {
        aValue = a?.venues?.map(v => v?.name)?.join(', ');
        bValue = b?.venues?.map(v => v?.name)?.join(', ');
      }

      if (aValue < bValue) return sortConfig?.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig?.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [opportunities, filters, sortConfig]);

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRemoveFilter = (filterKey) => {
    const updatedFilters = { ...filters };
    if (Array.isArray(updatedFilters?.[filterKey])) {
      updatedFilters[filterKey] = [];
    } else if (filterKey === 'searchTerm') {
      updatedFilters[filterKey] = '';
    } else {
      // Reset to default values
      if (filterKey === 'minSpread') updatedFilters[filterKey] = 0;
      if (filterKey === 'maxSpread') updatedFilters[filterKey] = 100;
      if (filterKey === 'minLiquidity') updatedFilters[filterKey] = 0;
      if (filterKey === 'minConfidence') updatedFilters[filterKey] = 0;
    }
    setFilters(updatedFilters);
  };

  const handleClearAllFilters = () => {
    setFilters({
      venues: [],
      categories: [],
      minSpread: 0,
      maxSpread: 100,
      minLiquidity: 0,
      minConfidence: 0,
      searchTerm: ''
    });
  };

  // Handle sorting
  const handleSort = (column) => {
    setSortConfig(prevConfig => ({
      key: column,
      direction: prevConfig?.key === column && prevConfig?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle row click
  const handleRowClick = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsDetailModalOpen(true);
  };

  // Handle refresh with improved fallback
  const handleRefreshData = async () => {
    try {
      setIsLoading(true);
      
      // Refresh the data ingestion system first
      await refreshDataIngestion();
      
      addNotification({
        type: 'success',
        title: 'Data Refreshed',
        message: `Market data updated. Found ${liveOpportunities?.length} live opportunities.`,
        autoClose: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: error?.message || 'Failed to refresh market data',
        autoClose: 4000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle export
  const handleExport = () => {
    const csvContent = [
      ['Market', 'Category', 'Gross Spread', 'Net Spread', 'Liquidity', 'Confidence'],
      ...filteredAndSortedOpportunities?.map(opp => [
        opp?.market,
        opp?.category,
        `${opp?.grossSpread}%`,
        `${opp?.netSpread}%`,
        `$${opp?.liquidity?.toLocaleString()}`,
        `${opp?.confidence}%`
      ])
    ]?.map(row => row?.join(','))?.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL?.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arbitrage-opportunities-${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
    document.body?.appendChild(a);
    a?.click();
    document.body?.removeChild(a);
    window.URL?.revokeObjectURL(url);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Backend Connection Status Banner
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NavigationTabs />
      <NotificationToast 
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      <main className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header with Live Data Status */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-heading font-bold text-card-foreground mb-2">
                Arbitrage Dashboard
              </h1>
              <p className="text-text-secondary">
                Monitor live arbitrage opportunities across prediction markets
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right mr-4">
                <p className="text-sm font-medium text-card-foreground">
                  {filteredOpportunities?.length} Live Opportunities
                </p>
                <p className="text-xs text-text-secondary">
                  {connectionStatus === 'live_ingestion' ? 'Real-time data feed active' : 
                   connectionStatus === 'backend_fallback'? 'Using backend data' : 'Connecting to data sources...'}
                </p>
              </div>
              <Button
                variant="default"
                onClick={handleRefreshData}
                loading={isLoading || dataIngestionLoading}
                iconName="RefreshCw"
                iconPosition="left"
              >
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Data Ingestion Status */}
          <DataIngestionStatus 
            showDetails={true}
            className="mb-6"
            onRefresh={(result) => {
              if (result?.success) {
                addNotification({
                  type: 'success',
                  title: 'Market Data Updated',
                  message: 'Latest arbitrage opportunities have been loaded.',
                  autoClose: 3000
                });
              }
            }}
          />

          {/* Enhanced Statistics with Live Data Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-text-secondary">Active Opportunities</h3>
                <Icon name="TrendingUp" size={16} className="text-success" />
              </div>
              <p className="text-2xl font-bold text-card-foreground">
                {dataStats?.activeOpportunities || filteredOpportunities?.length || 0}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {connectionStatus === 'live_ingestion' ? 'Live feed' : 'Historical data'}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-text-secondary">Average Spread</h3>
                <Icon name="Target" size={16} className="text-info" />
              </div>
              <p className="text-2xl font-bold text-card-foreground">
                {dataStats?.avgSpread ? `${dataStats?.avgSpread?.toFixed(2)}%` : 
                 statistics?.averageSpread ? `${statistics?.averageSpread?.toFixed(2)}%` : '0.00%'}
              </p>
              <p className="text-xs text-text-secondary mt-1">Across all venues</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-text-secondary">Total Volume</h3>
                <Icon name="DollarSign" size={16} className="text-warning" />
              </div>
              <p className="text-2xl font-bold text-card-foreground">
                ${dataStats?.totalVolume ? 
                  (dataStats?.totalVolume / 1000)?.toFixed(0) + 'K' : 
                  statistics?.totalLiquidity ? 
                  (statistics?.totalLiquidity / 1000)?.toFixed(0) + 'K' : '0'}
              </p>
              <p className="text-xs text-text-secondary mt-1">Available liquidity</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-text-secondary">Active Markets</h3>
                <Icon name="Globe" size={16} className="text-secondary" />
              </div>
              <p className="text-2xl font-bold text-card-foreground">
                {dataStats?.activeMarkets || availableVenues?.length || 0}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Across {dataStats?.totalVenues || availableVenues?.length || 0} venues
              </p>
            </div>
          </div>

          {/* Filter Sidebar */}
          <div className={`${isFilterSidebarCollapsed ? 'hidden lg:hidden' : 'block'} flex-shrink-0`}>
            <FilterSidebar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              isCollapsed={isFilterSidebarCollapsed}
              onToggleCollapse={() => setIsFilterSidebarCollapsed(!isFilterSidebarCollapsed)}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardToolbar
              activeFilters={filters}
              onRemoveFilter={handleRemoveFilter}
              onClearAllFilters={handleClearAllFilters}
              resultsCount={filteredAndSortedOpportunities?.length}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              onExport={handleExport}
              lastUpdated={lastUpdated}
            />

            <div className="flex-1 overflow-auto p-6">
              {error && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-error">Backend Connection Error</p>
                    <p className="text-xs text-text-secondary mt-1">{error}</p>
                  </div>
                  <button
                    onClick={handleRefresh}
                    className="px-3 py-1 text-xs bg-error text-white rounded hover:bg-error/90"
                  >
                    Retry
                  </button>
                </div>
              )}
              
              <OpportunityTable
                opportunities={filteredAndSortedOpportunities}
                onSort={handleSort}
                sortConfig={sortConfig}
                onRowClick={handleRowClick}
              />
            </div>
          </div>

          {/* Collapsed Filter Toggle */}
          {isFilterSidebarCollapsed && (
            <FilterSidebar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              isCollapsed={true}
              onToggleCollapse={() => setIsFilterSidebarCollapsed(false)}
            />
          )}
        </div>
      </main>
      {/* Opportunity Detail Modal */}
      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOpportunity(null);
        }}
      />
      {/* Notifications */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
        onAction={(notification) => {
          if (notification?.data) {
            // Find and show high spread opportunities
            const highSpreadOpps = opportunities?.filter(opp => 
              opp?.netSpread > 3 && opp?.confidence > 85
            );
            if (highSpreadOpps?.length > 0) {
              setSelectedOpportunity(highSpreadOpps?.[0]);
              setIsDetailModalOpen(true);
            }
          }
        }}
      />
    </div>
  );
};

export default ArbitrageDashboard;