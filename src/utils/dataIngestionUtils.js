import { marketDataService } from '../services/marketDataService';

/**
 * Utility functions for data ingestion integration
 * Provides easy-to-use helpers for components
 */

/**
 * Initialize data ingestion system
 */
export const initializeDataIngestion = async () => {
  try {
    console.log('Initializing ArbLens data ingestion system...');
    
    const status = await marketDataService?.initialize();
    
    console.log('Data ingestion system initialized:', {
      venues: status?.totalVenues,
      markets: status?.activeMarkets,
      opportunities: status?.activeOpportunities
    });
    
    return status;
  } catch (error) {
    console.error('Failed to initialize data ingestion:', error?.message);
    throw error;
  }
};

/**
 * Force refresh market data
 */
export const refreshMarketData = async () => {
  try {
    console.log('Forcing market data refresh...');
    
    const result = await marketDataService?.forceSyncMarketData();
    
    console.log('Market data refreshed successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to refresh market data:', error?.message);
    throw error;
  }
};

/**
 * Get current system status for monitoring
 */
export const getSystemStatus = async () => {
  try {
    const [stats, ingestionStatus] = await Promise.all([
      marketDataService?.getMarketStats(),
      marketDataService?.getIngestionStatus()
    ]);

    return {
      dataStats: stats,
      ingestionService: ingestionStatus,
      timestamp: new Date()?.toISOString(),
      healthStatus: determineHealthStatus(stats, ingestionStatus)
    };
  } catch (error) {
    console.error('Failed to get system status:', error?.message);
    return {
      dataStats: null,
      ingestionService: null,
      timestamp: new Date()?.toISOString(),
      healthStatus: 'error',
      error: error?.message
    };
  }
};

/**
 * Determine overall system health
 */
const determineHealthStatus = (stats, ingestionStatus) => {
  if (!stats || !ingestionStatus) return 'error';
  
  if (stats?.activeOpportunities > 0 && ingestionStatus?.isInitialized) {
    return 'healthy';
  }
  
  if (stats?.activeMarkets > 0) {
    return 'warning';
  }
  
  return 'critical';
};

/**
 * Setup real-time data monitoring
 */
export const setupRealTimeMonitoring = (callback) => {
  let isMonitoring = true;
  
  // Subscribe to market data changes
  const unsubscribeMarketData = marketDataService?.subscribeToMarketData((event, payload) => {
    if (isMonitoring && callback) {
      callback?.({
        type: 'market_data',
        event,
        payload,
        timestamp: new Date()?.toISOString()
      });
    }
  });

  // Periodic health checks
  const healthCheckInterval = setInterval(async () => {
    if (!isMonitoring) return;
    
    try {
      const status = await getSystemStatus();
      callback?.({
        type: 'health_check',
        status,
        timestamp: new Date()?.toISOString()
      });
    } catch (error) {
      callback?.({
        type: 'health_check_error',
        error: error?.message,
        timestamp: new Date()?.toISOString()
      });
    }
  }, 30000); // Every 30 seconds

  // Return cleanup function
  return () => {
    isMonitoring = false;
    unsubscribeMarketData?.();
    clearInterval(healthCheckInterval);
  };
};

/**
 * Validate market data quality
 */
export const validateDataQuality = async () => {
  try {
    const stats = await marketDataService?.getMarketStats();
    const issues = [];

    // Check for minimum data requirements
    if (stats?.totalVenues < 2) {
      issues?.push('Insufficient venues (minimum 2 required for arbitrage)');
    }

    if (stats?.activeMarkets < 4) {
      issues?.push('Insufficient active markets (minimum 4 recommended)');
    }

    if (stats?.activeOpportunities === 0) {
      issues?.push('No active arbitrage opportunities found');
    }

    if (stats?.avgSpread < 0.5) {
      issues?.push('Average spread too low for profitable arbitrage');
    }

    const dataAge = stats?.lastSync ? 
      (new Date() - new Date(stats?.lastSync)) / (1000 * 60) : 
      null;

    if (dataAge && dataAge > 10) {
      issues?.push(`Market data is ${Math.round(dataAge)} minutes old`);
    }

    return {
      isValid: issues?.length === 0,
      issues,
      stats,
      dataAge: dataAge ? Math.round(dataAge) : null,
      timestamp: new Date()?.toISOString()
    };
  } catch (error) {
    return {
      isValid: false,
      issues: [`Data validation failed: ${error?.message}`],
      stats: null,
      dataAge: null,
      timestamp: new Date()?.toISOString()
    };
  }
};

/**
 * Get formatted opportunities for display
 */
export const getFormattedOpportunities = async (filters = {}) => {
  try {
    const opportunities = await marketDataService?.getOpportunities(filters);
    
    return opportunities?.map(opp => ({
      id: opp?.id,
      market: {
        title: opp?.pair?.market_a?.title || opp?.pair?.market_b?.title || 'Unknown Market',
        category: opp?.pair?.market_a?.category || opp?.pair?.market_b?.category || 'Other'
      },
      venues: {
        a: {
          name: opp?.pair?.market_a?.venue?.name || 'Unknown Venue',
          side: opp?.venue_a_side,
          price: opp?.venue_a_price,
          liquidity: opp?.venue_a_liquidity
        },
        b: {
          name: opp?.pair?.market_b?.venue?.name || 'Unknown Venue',
          side: opp?.venue_b_side,
          price: opp?.venue_b_price,
          liquidity: opp?.venue_b_liquidity
        }
      },
      profitability: {
        grossSpread: opp?.gross_spread_pct,
        netSpread: opp?.net_spread_pct,
        expectedProfitUsd: opp?.expected_profit_usd,
        maxTradableAmount: opp?.max_tradable_amount
      },
      metadata: {
        riskLevel: opp?.risk_level,
        confidence: opp?.pair?.confidence_score,
        createdAt: opp?.created_at,
        updatedAt: opp?.updated_at
      }
    })) || [];
  } catch (error) {
    console.error('Failed to get formatted opportunities:', error?.message);
    return [];
  }
};

/**
 * Cleanup and maintenance utilities
 */
export const performMaintenance = async () => {
  try {
    console.log('Starting data maintenance...');
    
    const cleanedCount = await marketDataService?.cleanupStaleData();
    const statusBefore = await getSystemStatus();
    
    // Force a fresh sync after cleanup
    await refreshMarketData();
    
    const statusAfter = await getSystemStatus();
    
    console.log('Data maintenance completed:', {
      cleanedRecords: cleanedCount,
      opportunitiesBefore: statusBefore?.dataStats?.activeOpportunities,
      opportunitiesAfter: statusAfter?.dataStats?.activeOpportunities
    });
    
    return {
      cleanedRecords: cleanedCount,
      statusBefore,
      statusAfter,
      timestamp: new Date()?.toISOString()
    };
  } catch (error) {
    console.error('Data maintenance failed:', error?.message);
    throw error;
  }
};

/**
 * Export utility functions for easy importing
 */
export const DataIngestionUtils = {
  initialize: initializeDataIngestion,
  refresh: refreshMarketData,
  getStatus: getSystemStatus,
  setupMonitoring: setupRealTimeMonitoring,
  validateQuality: validateDataQuality,
  getOpportunities: getFormattedOpportunities,
  performMaintenance
};

export default DataIngestionUtils;