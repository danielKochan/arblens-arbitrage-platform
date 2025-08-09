import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '../../components/ui/Header';
import NavigationTabs from '../../components/ui/NavigationTabs';
import NotificationToast, { useNotifications } from '../../components/ui/NotificationToast';
import FilterSidebar from './components/FilterSidebar';
import DashboardToolbar from './components/DashboardToolbar';
import { OpportunityTable } from './components/OpportunityTable';
import OpportunityDetailModal from './components/OpportunityDetailModal';

const ArbitrageDashboard = () => {
  const [isFilterSidebarCollapsed, setIsFilterSidebarCollapsed] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [sortConfig, setSortConfig] = useState({ key: 'netSpread', direction: 'desc' });
  
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

  // Mock arbitrage opportunities data
  const mockOpportunities = [
    {
      id: 'arb_001',
      market: 'Will Donald Trump win the 2024 US Presidential Election?',
      category: 'Politics',
      venues: [
        { name: 'Polymarket', price: 52.3, volume: 45000, fee: 0.5 },
        { name: 'Kalshi', price: 48.7, volume: 32000, fee: 0.3 }
      ],
      grossSpread: 3.6,
      netSpread: 2.8,
      liquidity: 77000,
      confidence: 87,
      isNew: true,
      buyLink: 'https://polymarket.com/event/presidential-election-2024',
      sellLink: 'https://kalshi.com/events/PRES-24'
    },
    {
      id: 'arb_002',
      market: 'Bitcoin to reach $100,000 by end of 2024?',
      category: 'Crypto',
      venues: [
        { name: 'Manifold', price: 34.2, volume: 12000, fee: 0.0 },
        { name: 'Betfair', price: 31.8, volume: 28000, fee: 0.8 }
      ],
      grossSpread: 2.4,
      netSpread: 1.6,
      liquidity: 40000,
      confidence: 73,
      isNew: false,
      buyLink: 'https://manifold.markets/bitcoin-100k',
      sellLink: 'https://betfair.com/crypto-markets'
    },
    {
      id: 'arb_003',
      market: 'Will the Federal Reserve cut rates in December 2024?',
      category: 'Economics',
      venues: [
        { name: 'Kalshi', price: 67.5, volume: 89000, fee: 0.3 },
        { name: 'Polymarket', price: 63.1, volume: 56000, fee: 0.5 }
      ],
      grossSpread: 4.4,
      netSpread: 3.6,
      liquidity: 145000,
      confidence: 92,
      isNew: false,
      buyLink: 'https://kalshi.com/events/FED-RATE-DEC',
      sellLink: 'https://polymarket.com/event/fed-rates-december'
    },
    {
      id: 'arb_004',
      market: 'Will Taylor Swift announce new album in 2024?',
      category: 'Entertainment',
      venues: [
        { name: 'Manifold', price: 28.9, volume: 8500, fee: 0.0 },
        { name: 'Polymarket', price: 25.3, volume: 15000, fee: 0.5 }
      ],
      grossSpread: 3.6,
      netSpread: 3.1,
      liquidity: 23500,
      confidence: 65,
      isNew: true,
      buyLink: 'https://manifold.markets/taylor-swift-album',
      sellLink: 'https://polymarket.com/event/taylor-swift-2024'
    },
    {
      id: 'arb_005',
      market: 'Will there be a major earthquake (7.0+) in California in 2024?',
      category: 'Weather',
      venues: [
        { name: 'Betfair', price: 15.7, volume: 22000, fee: 0.8 },
        { name: 'Kalshi', price: 12.4, volume: 18000, fee: 0.3 }
      ],
      grossSpread: 3.3,
      netSpread: 2.2,
      liquidity: 40000,
      confidence: 58,
      isNew: false,
      buyLink: 'https://betfair.com/natural-disasters',
      sellLink: 'https://kalshi.com/events/EARTHQUAKE-CA'
    }
  ];

  // Filter and sort opportunities
  const filteredAndSortedOpportunities = useMemo(() => {
    let filtered = mockOpportunities?.filter(opportunity => {
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
  }, [filters, sortConfig]);

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

  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);
    setLastUpdated(new Date());
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      
      // Add notification for new opportunities
      if (Math.random() > 0.7) {
        addNotification({
          type: 'opportunity',
          title: 'New High-Confidence Opportunity',
          message: 'Bitcoin $100K prediction shows 4.2% spread',
          data: {
            pair: 'BTC-100K',
            profit: '4.2'
          },
          action: {
            label: 'View Details'
          }
        });
      }
    }, 1500);
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
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Simulate new opportunities
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        addNotification({
          type: 'opportunity',
          title: 'Price Movement Alert',
          message: 'Significant spread change detected in Fed rates market',
          autoClose: 8000
        });
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [addNotification]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NavigationTabs />
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
            // Find and show the opportunity
            const opportunity = mockOpportunities?.find(opp => 
              opp?.market?.toLowerCase()?.includes('bitcoin') || 
              opp?.market?.toLowerCase()?.includes('fed')
            );
            if (opportunity) {
              setSelectedOpportunity(opportunity);
              setIsDetailModalOpen(true);
            }
          }
        }}
      />
    </div>
  );
};

export default ArbitrageDashboard;