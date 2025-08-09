import { supabase } from '../lib/supabase';

/**
 * Service for managing market data operations and real-time updates
 * Works with the data ingestion service to provide clean API for components
 */
class MarketDataService {
  constructor() {
    this.cache = new Map();
    this.subscribers = new Set();
    this.lastSync = null;
  }

  /**
   * Force a market data sync by triggering the ingestion service
   */
  async forceSyncMarketData() {
    try {
      // Import and trigger the data ingestion service
      const { dataIngestionService } = await import('./marketDataIngestion.js');
      
      // Ensure it's initialized
      if (!dataIngestionService?.isRunning) {
        await dataIngestionService?.initialize();
      }
      
      // Force immediate sync
      await dataIngestionService?.forceSync();
      
      this.lastSync = new Date();
      
      // Notify all subscribers
      this.notifySubscribers('data_synced', { timestamp: this.lastSync });
      
      return { success: true, timestamp: this.lastSync };
    } catch (error) {
      console.error('Failed to force market data sync:', error?.message);
      throw new Error(`Market sync failed: ${error?.message}`);
    }
  }

  /**
   * Get current market statistics
   */
  async getMarketStats() {
    try {
      const { data, error } = await supabase?.rpc('get_market_stats');
      
      if (error) {
        throw error;
      }
      
      return {
        totalVenues: data?.[0]?.total_venues || 0,
        activeMarkets: data?.[0]?.active_markets || 0,
        totalPairs: data?.[0]?.total_pairs || 0,
        activeOpportunities: data?.[0]?.active_opportunities || 0,
        avgSpread: parseFloat(data?.[0]?.avg_spread || 0),
        totalVolume: parseFloat(data?.[0]?.total_volume || 0),
        lastSync: this.lastSync
      };
    } catch (error) {
      console.error('Failed to get market stats:', error?.message);
      return {
        totalVenues: 0,
        activeMarkets: 0,
        totalPairs: 0,
        activeOpportunities: 0,
        avgSpread: 0,
        totalVolume: 0,
        lastSync: null
      };
    }
  }

  /**
   * Get opportunities with real-time data freshness check
   */
  async getOpportunities(filters = {}) {
    try {
      // Check if data is fresh (less than 5 minutes old)
      if (this.isDataStale()) {
        console.log('Data appears stale, attempting sync...');
        try {
          await this.forceSyncMarketData();
        } catch (syncError) {
          console.warn('Sync failed, using existing data:', syncError?.message);
        }
      }

      // Build query with proper joins
      let query = supabase?.from('arbitrage_opportunities')?.select(`
        *,
        pair:pair_id (
          *,
          market_a:market_a_id (
            *,
            venue:venue_id (*)
          ),
          market_b:market_b_id (
            *,
            venue:venue_id (*)
          )
        )
      `)?.eq('status', 'active')?.order('net_spread_pct', { ascending: false });

      // Apply filters
      if (filters?.min_spread) {
        query = query?.gte('net_spread_pct', filters?.min_spread);
      }

      if (filters?.min_liquidity) {
        query = query?.gte('max_tradable_amount', filters?.min_liquidity);
      }

      if (filters?.category) {
        // This requires a more complex query - we'll handle it after fetching
      }

      const { data, error } = await query?.limit(filters?.limit || 50);
      
      if (error) {
        throw error;
      }

      let opportunities = data || [];

      // Apply category filter if specified
      if (filters?.category) {
        opportunities = opportunities?.filter(opp => 
          opp?.pair?.market_a?.category === filters?.category ||
          opp?.pair?.market_b?.category === filters?.category
        );
      }

      // Cache the results
      this.cache?.set('opportunities', {
        data: opportunities,
        timestamp: new Date(),
        filters
      });

      return opportunities;
    } catch (error) {
      console.error('Failed to get opportunities:', error?.message);
      
      // Return cached data if available
      const cached = this.cache?.get('opportunities');
      if (cached) {
        console.log('Returning cached opportunities due to error');
        return cached?.data;
      }
      
      throw error;
    }
  }

  /**
   * Get markets with venue information
   */
  async getMarkets(filters = {}) {
    try {
      let query = supabase?.from('markets')?.select(`
        *,
        venue:venue_id (*)
      `)?.eq('status', 'active')?.order('last_updated', { ascending: false });

      if (filters?.venue_id) {
        query = query?.eq('venue_id', filters?.venue_id);
      }

      if (filters?.category) {
        query = query?.eq('category', filters?.category);
      }

      const { data, error } = await query?.limit(filters?.limit || 100);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to get markets:', error?.message);
      throw error;
    }
  }

  /**
   * Get market pairs for analysis
   */
  async getMarketPairs(filters = {}) {
    try {
      let query = supabase?.from('market_pairs')?.select(`
        *,
        market_a:market_a_id (
          *,
          venue:venue_id (*)
        ),
        market_b:market_b_id (
          *,
          venue:venue_id (*)
        )
      `)?.order('confidence_score', { ascending: false });

      if (filters?.min_confidence) {
        query = query?.gte('confidence_score', filters?.min_confidence);
      }

      const { data, error } = await query?.limit(filters?.limit || 50);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to get market pairs:', error?.message);
      throw error;
    }
  }

  /**
   * Cleanup stale market data
   */
  async cleanupStaleData() {
    try {
      const { data, error } = await supabase?.rpc('cleanup_stale_markets');
      
      if (error) {
        throw error;
      }
      
      console.log(`Cleaned up ${data} stale market records`);
      return data;
    } catch (error) {
      console.error('Failed to cleanup stale data:', error?.message);
      return 0;
    }
  }

  /**
   * Subscribe to real-time market data changes
   */
  subscribeToMarketData(callback) {
    // Add callback to subscribers
    this.subscribers?.add(callback);

    // Set up Supabase real-time subscriptions
    const opportunityChannel = supabase?.channel('opportunities')
      ?.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'arbitrage_opportunities'
      }, (payload) => {
        this.notifySubscribers('opportunity_change', payload);
      })
      ?.subscribe();

    const marketChannel = supabase?.channel('markets')
      ?.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'markets'
      }, (payload) => {
        this.notifySubscribers('market_change', payload);
      })
      ?.subscribe();

    // Return unsubscribe function
    return () => {
      this.subscribers?.delete(callback);
      supabase?.removeChannel(opportunityChannel);
      supabase?.removeChannel(marketChannel);
    };
  }

  /**
   * Check if cached data is stale
   */
  isDataStale() {
    if (!this.lastSync) return true;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastSync < fiveMinutesAgo;
  }

  /**
   * Notify all subscribers of changes
   */
  notifySubscribers(event, payload) {
    this.subscribers?.forEach(callback => {
      try {
        callback?.(event, payload);
      } catch (error) {
        console.error('Error in market data subscriber:', error?.message);
      }
    });
  }

  /**
   * Get data ingestion service status
   */
  async getIngestionStatus() {
    try {
      const { dataIngestionService } = await import('./marketDataIngestion.js');
      
      return {
        isRunning: dataIngestionService?.isRunning || false,
        lastSync: this.lastSync,
        adapterCount: dataIngestionService?.adapters?.length || 0,
        isInitialized: !!dataIngestionService?.adapters?.[0]?.venueId
      };
    } catch (error) {
      return {
        isRunning: false,
        lastSync: null,
        adapterCount: 0,
        isInitialized: false,
        error: error?.message
      };
    }
  }

  /**
   * Initialize the market data service
   */
  async initialize() {
    try {
      // Start the data ingestion service
      const { dataIngestionService } = await import('./marketDataIngestion.js');
      
      if (!dataIngestionService?.isRunning) {
        await dataIngestionService?.initialize();
        console.log('Market data service initialized successfully');
      }
      
      // Get initial stats
      const stats = await this.getMarketStats();
      console.log('Current market stats:', stats);
      
      return stats;
    } catch (error) {
      console.error('Failed to initialize market data service:', error?.message);
      throw error;
    }
  }

  /**
   * Get historical data for backtesting
   */
  async getHistoricalOpportunities(startDate, endDate, filters = {}) {
    try {
      let query = supabase?.from('arbitrage_opportunities')?.select(`
        *,
        pair:pair_id (
          *,
          market_a:market_a_id (
            *,
            venue:venue_id (*)
          ),
          market_b:market_b_id (
            *,
            venue:venue_id (*)
          )
        )
      `)?.gte('created_at', startDate)?.lte('created_at', endDate)?.order('created_at', { ascending: false });

      if (filters?.min_spread_pct) {
        query = query?.gte('net_spread_pct', filters?.min_spread_pct);
      }

      if (filters?.min_liquidity_usd) {
        query = query?.gte('max_tradable_amount', filters?.min_liquidity_usd);
      }

      const { data, error } = await query?.limit(5000);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to get historical opportunities:', error?.message);
      throw error;
    }
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();

export default marketDataService;