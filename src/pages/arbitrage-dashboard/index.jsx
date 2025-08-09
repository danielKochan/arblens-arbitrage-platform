import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '../../components/ui/Header';
import NavigationTabs from '../../components/ui/NavigationTabs';
import NotificationToast, { useNotifications } from '../../components/ui/NotificationToast';
import FilterSidebar from './components/FilterSidebar';
import DashboardToolbar from './components/DashboardToolbar';
import { OpportunityTable } from './components/OpportunityTable';
import OpportunityDetailModal from './components/OpportunityDetailModal';
import { arbitrageService, subscriptionService } from '../../utils/backendServices';
import supabaseServices from '../../utils/supabaseServices';

const ArbitrageDashboard = () => {
  const [isFilterSidebarCollapsed, setIsFilterSidebarCollapsed] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [sortConfig, setSortConfig] = useState({ key: 'netSpread', direction: 'desc' });
  const [opportunities, setOpportunities] = useState([]);
  const [error, setError] = useState('');
  
  const { notifications, addNotification, dismissNotification } = useNotifications();

  const [filters, setFilters] = useState({
    venues: [],
    categories: [],
    minSpread: 0,
    maxSpread: 100,
    minLiquidity: 0,
    minConfidence: 0,
    searchTerm: ''
  });

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

  // Load initial opportunities with Supabase fallback
  useEffect(() => {
    let isMounted = true;
    
    const loadOpportunities = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Try backend first, fallback to Supabase automatically
        let data;
        try {
          data = await arbitrageService?.getOpportunities({
            min_spread: 1.0,
            min_liquidity: 500,
            limit: 100,
            status: 'active'
          });
          // Transform backend data
          let transformedOpportunities = data?.map(transformBackendOpportunity) || [];
          setOpportunities(transformedOpportunities);
        } catch (backendError) {
          // If backend fails, use Supabase directly
          console.warn('Backend failed, using Supabase directly:', backendError?.message);
          data = await supabaseServices?.arbitrageService?.getOpportunities({
            min_spread: 1.0,
            min_liquidity: 500
          });
          // Transform Supabase data
          let transformedOpportunities = data?.map(transformSupabaseOpportunity) || [];
          setOpportunities(transformedOpportunities);
        }
        
        if (!isMounted) return;
        
        setLastUpdated(new Date());
        
      } catch (error) {
        if (!isMounted) return;
        
        setError(error?.message || 'Failed to load opportunities');
        addNotification({
          type: 'error',
          title: 'Loading Error', 
          message: error?.message || 'Failed to connect to data source',
          autoClose: 5000
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadOpportunities();
    
    return () => {
      isMounted = false;
    };
  }, [addNotification]);

  // Real-time subscription for opportunities
  useEffect(() => {
    // Always use Supabase for real-time subscriptions
    const unsubscribe = supabaseServices?.subscriptionService?.subscribeToOpportunities((payload) => {
      if (payload?.eventType === 'INSERT' && payload?.new) {
        const newOpportunity = transformSupabaseOpportunity(payload?.new);
        setOpportunities(prev => [newOpportunity, ...prev?.slice(0, 49)]); // Keep 50 most recent
        setLastUpdated(new Date());
        
        // Show notification for high-confidence opportunities
        if (newOpportunity?.netSpread > 3 && newOpportunity?.confidence > 85) {
          addNotification({
            type: 'opportunity',
            title: 'New High-Value Opportunity',
            message: `${newOpportunity?.netSpread?.toFixed(2)}% spread on ${newOpportunity?.market}`,
            data: newOpportunity,
            autoClose: 8000
          });
        }
      } else if (payload?.eventType === 'UPDATE' && payload?.new) {
        const updatedOpportunity = transformSupabaseOpportunity(payload?.new);
        setOpportunities(prev => 
          prev?.map(opp => opp?.id === updatedOpportunity?.id ? updatedOpportunity : opp)
        );
        setLastUpdated(new Date());
      }
    });

    return unsubscribe;
  }, [addNotification]);

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
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      let data;
      let transformedOpportunities;
      
      try {
        // Try backend first
        data = await arbitrageService?.getOpportunities({
          min_spread: 1.0,
          min_liquidity: 500,
          limit: 100,
          status: 'active'
        });
        transformedOpportunities = data?.map(transformBackendOpportunity) || [];
      } catch (backendError) {
        // Fallback to Supabase
        console.warn('Backend refresh failed, using Supabase:', backendError?.message);
        data = await supabaseServices?.arbitrageService?.getOpportunities({
          min_spread: 1.0,
          min_liquidity: 500
        });
        transformedOpportunities = data?.map(transformSupabaseOpportunity) || [];
      }
      
      setOpportunities(transformedOpportunities);
      setLastUpdated(new Date());
      
      // Add success notification
      addNotification({
        type: 'success',
        title: 'Data Refreshed',
        message: `Loaded ${transformedOpportunities?.length} live arbitrage opportunities`,
        autoClose: 3000
      });
      
      // Check for high-confidence opportunities
      const highConfidenceOpps = transformedOpportunities?.filter(opp => 
        opp?.netSpread > 3 && opp?.confidence > 85
      );
      
      if (highConfidenceOpps?.length > 0) {
        addNotification({
          type: 'opportunity',
          title: 'High-Confidence Opportunities',
          message: `${highConfidenceOpps?.length} opportunities with >3% spread available`,
          data: {
            count: highConfidenceOpps?.length,
            maxSpread: Math.max(...highConfidenceOpps?.map(o => o?.netSpread))
          },
          action: {
            label: 'View Opportunities'
          }
        });
      }
      
    } catch (error) {
      setError(error?.message || 'Failed to refresh data');
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: error?.message || 'Could not connect to any data source',
        autoClose: 5000
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
      <div className="bg-success/10 border-b border-success/20 px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            <span className="text-sm font-medium text-success">
              Connected to Live Backend
            </span>
            <span className="text-xs text-text-secondary">
              • https://arblens-backend.onrender.com • {opportunities?.length || 0} opportunities
            </span>
          </div>
          <div className="text-xs text-text-secondary">
            Last updated: {lastUpdated?.toLocaleTimeString()}
          </div>
        </div>
      </div>
      <div className="flex h-[calc(100vh-8rem)]">
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