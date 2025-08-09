import React, { useState, useEffect } from 'react';
import { Header } from '../../components/ui/Header';
import NavigationTabs from '../../components/ui/NavigationTabs';
import NotificationToast, { useNotifications } from '../../components/ui/NotificationToast';
import MarketPairTable from './components/MarketPairTable';
import PairDetailPanel from './components/PairDetailPanel';
import FilterPanel from './components/FilterPanel';
import BulkActionDialog from './components/BulkActionDialog';
import SystemParametersPanel from './components/SystemParametersPanel';

import Button from '../../components/ui/Button';

const MarketPairManagement = () => {
  const { notifications, addNotification, dismissNotification } = useNotifications();
  const [selectedPair, setSelectedPair] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showSystemParams, setShowSystemParams] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkActionDialog, setBulkActionDialog] = useState({
    isOpen: false,
    action: null,
    selectedPairs: []
  });

  const [filters, setFilters] = useState({
    minConfidence: '',
    venues: [],
    categories: [],
    status: 'all'
  });

  // Mock data for market pairs
  const [marketPairs, setMarketPairs] = useState([
    {
      id: 'pair-1',
      market1: {
        title: 'Will Donald Trump win the 2024 US Presidential Election?',
        description: 'Resolves YES if Donald Trump wins the 2024 US Presidential Election',
        venue: 'Polymarket',
        price: '0.67',
        volume: '2.4M'
      },
      market2: {
        title: 'Donald Trump to be elected US President in 2024',
        description: 'Market resolves to YES if Donald Trump is elected President in 2024',
        venue: 'Kalshi',
        price: '0.64',
        volume: '1.8M'
      },
      confidence: 94,
      category: 'Politics',
      status: 'active',
      lastModified: '2025-01-09T15:30:00Z'
    },
    {
      id: 'pair-2',
      market1: {
        title: 'Will Bitcoin reach $100,000 by end of 2025?',
        description: 'Resolves YES if Bitcoin price reaches $100,000 USD by December 31, 2025',
        venue: 'Manifold',
        price: '0.42',
        volume: '890K'
      },
      market2: {
        title: 'Bitcoin to hit $100K in 2025',
        description: 'YES if Bitcoin reaches $100,000 at any point during 2025',
        venue: 'Betfair',
        price: '0.38',
        volume: '1.2M'
      },
      confidence: 87,
      category: 'Economics',
      status: 'pending',
      lastModified: '2025-01-09T14:15:00Z'
    },
    {
      id: 'pair-3',
      market1: {
        title: 'Will OpenAI release GPT-5 in 2025?',
        description: 'Resolves YES if OpenAI officially releases GPT-5 during 2025',
        venue: 'Polymarket',
        price: '0.73',
        volume: '1.5M'
      },
      market2: {
        title: 'GPT-5 launch in 2025',
        description: 'Market on whether OpenAI will launch GPT-5 in 2025',
        venue: 'Manifold',
        price: '0.69',
        volume: '650K'
      },
      confidence: 91,
      category: 'Technology',
      status: 'overridden',
      lastModified: '2025-01-09T13:45:00Z'
    },
    {
      id: 'pair-4',
      market1: {
        title: 'Will the Lakers make the NBA playoffs in 2025?',
        description: 'Resolves YES if LA Lakers qualify for 2025 NBA playoffs',
        venue: 'Betfair',
        price: '0.58',
        volume: '2.1M'
      },
      market2: {
        title: 'Lakers playoff qualification 2025',
        description: 'Will the Los Angeles Lakers make the 2025 NBA playoffs',
        venue: 'Kalshi',
        price: '0.55',
        volume: '1.7M'
      },
      confidence: 76,
      category: 'Sports',
      status: 'active',
      lastModified: '2025-01-09T12:20:00Z'
    },
    {
      id: 'pair-5',
      market1: {
        title: 'Will there be a major earthquake in California in 2025?',
        description: 'Resolves YES if magnitude 7.0+ earthquake occurs in California during 2025',
        venue: 'Manifold',
        price: '0.15',
        volume: '420K'
      },
      market2: {
        title: 'California earthquake 7.0+ in 2025',
        description: 'Major earthquake (7.0+) to hit California in 2025',
        venue: 'Polymarket',
        price: '0.12',
        volume: '380K'
      },
      confidence: 68,
      category: 'Weather',
      status: 'rejected',
      lastModified: '2025-01-09T11:10:00Z'
    }
  ]);

  // Mock user role (in real app, this would come from auth context)
  const [userRole] = useState('admin'); // 'admin' or 'user'
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        addNotification({
          type: 'opportunity',
          title: 'New High-Confidence Pair',
          message: 'A new market pair with 96% confidence has been detected',
          data: {
            pair: 'TRUMP2024/KALSHI-POLY',
            profit: '3.2'
          },
          action: {
            label: 'Review Pair'
          }
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [addNotification]);

  const handleSelectPair = (pair) => {
    setSelectedPair(pair);
    setShowDetailPanel(true);
  };

  const handleUpdatePair = (pairId, updates) => {
    setMarketPairs(prev => prev?.map(pair => 
      pair?.id === pairId ? { ...pair, ...updates } : pair
    ));
    
    addNotification({
      type: 'success',
      title: 'Pair Updated',
      message: 'Market pair configuration has been updated successfully'
    });
  };

  const handleBulkAction = (action, selectedPairIds, reason = '') => {
    setBulkActionDialog({
      isOpen: true,
      action,
      selectedPairs: selectedPairIds
    });
  };

  const handleConfirmBulkAction = async (action, selectedPairIds, reason) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const statusMap = {
      'approve': 'active',
      'reject': 'rejected',
      'link': 'active',
      'unlink': 'pending'
    };

    setMarketPairs(prev => prev?.map(pair => 
      selectedPairIds?.includes(pair?.id) 
        ? { 
            ...pair, 
            status: statusMap?.[action] || pair?.status,
            lastModified: new Date()?.toISOString(),
            overrideReason: reason || undefined
          }
        : pair
    ));

    addNotification({
      type: 'success',
      title: 'Bulk Action Completed',
      message: `Successfully ${action}ed ${selectedPairIds?.length} market pair${selectedPairIds?.length !== 1 ? 's' : ''}`
    });

    setBulkActionDialog({ isOpen: false, action: null, selectedPairs: [] });
  };

  const handleResetFilters = () => {
    setFilters({
      minConfidence: '',
      venues: [],
      categories: [],
      status: 'all'
    });
    setSearchQuery('');
  };

  const handleUpdateSystemParameters = async (parameters) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    addNotification({
      type: 'success',
      title: 'System Parameters Updated',
      message: 'System matching parameters have been updated successfully'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NavigationTabs />
      <div className="pt-32 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                  Market Pair Management
                </h1>
                <p className="text-text-secondary">
                  Review, configure, and manage cross-venue market pair matching with confidence scoring
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => setShowSystemParams(!showSystemParams)}
                    iconName="Settings2"
                    iconPosition="left"
                  >
                    System Parameters
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowDetailPanel(!showDetailPanel)}
                  iconName={showDetailPanel ? 'PanelRightClose' : 'PanelRightOpen'}
                  iconPosition="left"
                >
                  {showDetailPanel ? 'Hide' : 'Show'} Details
                </Button>
              </div>
            </div>
          </div>

          {/* System Parameters Panel */}
          {showSystemParams && (
            <div className="mb-6">
              <SystemParametersPanel
                isAdmin={isAdmin}
                onUpdateParameters={handleUpdateSystemParameters}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-12 gap-6">
            {/* Filters Sidebar */}
            <div className="col-span-12 lg:col-span-3">
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onResetFilters={handleResetFilters}
              />
            </div>

            {/* Market Pairs Table */}
            <div className={`col-span-12 ${showDetailPanel ? 'lg:col-span-5' : 'lg:col-span-9'}`}>
              <MarketPairTable
                marketPairs={marketPairs}
                selectedPair={selectedPair}
                onSelectPair={handleSelectPair}
                filters={filters}
                searchQuery={searchQuery}
                onBulkAction={handleBulkAction}
              />
            </div>

            {/* Detail Panel */}
            {showDetailPanel && (
              <div className="col-span-12 lg:col-span-4">
                <PairDetailPanel
                  selectedPair={selectedPair}
                  onUpdatePair={handleUpdatePair}
                  onClose={() => setShowDetailPanel(false)}
                />
              </div>
            )}
          </div>

          {/* Mobile Detail Panel Overlay */}
          {showDetailPanel && selectedPair && (
            <div className="lg:hidden fixed inset-0 z-[1100] bg-black/50 backdrop-blur-sm">
              <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-lg max-h-[80vh] overflow-hidden">
                <PairDetailPanel
                  selectedPair={selectedPair}
                  onUpdatePair={handleUpdatePair}
                  onClose={() => setShowDetailPanel(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Bulk Action Dialog */}
      <BulkActionDialog
        isOpen={bulkActionDialog?.isOpen}
        onClose={() => setBulkActionDialog({ isOpen: false, action: null, selectedPairs: [] })}
        action={bulkActionDialog?.action}
        selectedPairs={bulkActionDialog?.selectedPairs}
        onConfirm={handleConfirmBulkAction}
      />
      {/* Notifications */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
        onAction={(notification) => {
          if (notification?.action?.label === 'Review Pair') {
            // Find and select the relevant pair
            const pair = marketPairs?.find(p => p?.confidence >= 95);
            if (pair) {
              handleSelectPair(pair);
            }
          }
        }}
      />
    </div>
  );
};

export default MarketPairManagement;