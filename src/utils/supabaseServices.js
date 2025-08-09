import { supabase } from '../lib/supabase';

// Venue Services
export const venueService = {
  async getVenues() {
    try {
      const { data, error } = await supabase?.from('venues')?.select('*')?.order('name');
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  },

  async getActiveVenues() {
    try {
      const { data, error } = await supabase?.from('venues')?.select('*')?.eq('status', 'active')?.order('name');
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  }
};

// Market Services
export const marketService = {
  async getMarkets(filters = {}) {
    try {
      let query = supabase?.from('markets')?.select(`
          *,
          venue:venues(*)
        `)?.order('last_updated', { ascending: false });

      if (filters?.venue_id) {
        query = query?.eq('venue_id', filters?.venue_id);
      }

      if (filters?.status) {
        query = query?.eq('status', filters?.status);
      }

      if (filters?.category) {
        query = query?.eq('category', filters?.category);
      }

      const { data, error } = await query?.limit(100);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  },

  async getMarketById(marketId) {
    try {
      const { data, error } = await supabase?.from('markets')?.select(`
          *,
          venue:venues(*)
        `)?.eq('id', marketId)?.single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  }
};

// Arbitrage Opportunities Services
export const arbitrageService = {
  async getOpportunities(filters = {}) {
    try {
      let query = supabase?.from('arbitrage_opportunities')?.select(`
          *,
          pair:market_pairs(
            *,
            market_a:market_a_id(
              *,
              venue:venues(*)
            ),
            market_b:market_b_id(
              *,
              venue:venues(*)
            )
          )
        `)?.eq('status', 'active')?.order('net_spread_pct', { ascending: false });

      if (filters?.min_spread) {
        query = query?.gte('net_spread_pct', filters?.min_spread);
      }

      if (filters?.min_liquidity) {
        query = query?.gte('max_tradable_amount', filters?.min_liquidity);
      }

      if (filters?.venues?.length > 0) {
        // This would require a more complex query in practice
        // For now, we'll filter client-side if needed
      }

      const { data, error } = await query?.limit(50);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  },

  async getOpportunityById(opportunityId) {
    try {
      const { data, error } = await supabase?.from('arbitrage_opportunities')?.select(`*,pair:market_pairs(*,market_a:market_a_id(*,venue:venues(*)),market_b:market_b_id(*,venue:venues(*)))`)?.eq('id', opportunityId)?.single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  }
};

// Market Pair Services
export const marketPairService = {
  async getMarketPairs(filters = {}) {
    try {
      let query = supabase?.from('market_pairs')?.select(`
          *,
          market_a:market_a_id(
            *,
            venue:venues(*)
          ),
          market_b:market_b_id(
            *,
            venue:venues(*)
          )
        `)?.order('confidence_score', { ascending: false });

      if (filters?.min_confidence) {
        query = query?.gte('confidence_score', filters?.min_confidence);
      }

      if (filters?.manual_only === true) {
        query = query?.eq('is_manual_override', true);
      }

      const { data, error } = await query?.limit(100);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  },

  async approvePair(pairId, userId) {
    try {
      const { data, error } = await supabase?.from('market_pairs')?.update({
          is_manual_override: true,
          manually_approved_by: userId,
          updated_at: new Date()?.toISOString()
        })?.eq('id', pairId)?.select()?.single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  }
};

// API Key Services
export const apiKeyService = {
  async getUserApiKeys(userId) {
    try {
      const { data, error } = await supabase?.from('api_keys')?.select('id, key_name, key_prefix, tier, rate_limit_per_minute, is_active, last_used_at, expires_at, created_at')?.eq('user_id', userId)?.eq('is_active', true)?.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  },

  async createApiKey(userId, keyName, tier = 'free') {
    try {
      // Generate a mock API key - in production, this should be done securely server-side
      const keyValue = 'arb_' + Math.random()?.toString(36)?.substring(2, 15) + Math.random()?.toString(36)?.substring(2, 15);
      const keyPrefix = keyValue?.substring(0, 8);
      const keyHash = 'hashed_' + keyValue; // In production, use proper hashing

      const { data, error } = await supabase?.from('api_keys')?.insert({
          user_id: userId,
          key_name: keyName,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          tier,
          rate_limit_per_minute: tier === 'free' ? 60 : tier === 'pro' ? 300 : 1000
        })?.select()?.single();
      
      if (error) {
        throw error;
      }
      
      return { ...data, key_value: keyValue }; // Return the actual key only once
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  },

  async deleteApiKey(apiKeyId, userId) {
    try {
      const { error } = await supabase?.from('api_keys')?.update({ is_active: false })?.eq('id', apiKeyId)?.eq('user_id', userId);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  }
};

// Alert Services
export const alertService = {
  async getUserAlertRules(userId) {
    try {
      const { data, error } = await supabase?.from('alert_rules')?.select('*')?.eq('user_id', userId)?.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  },

  async createAlertRule(userId, alertData) {
    try {
      const { data, error } = await supabase?.from('alert_rules')?.insert({
          user_id: userId,
          ...alertData
        })?.select()?.single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  },

  async updateAlertRule(alertId, userId, updates) {
    try {
      const { data, error } = await supabase?.from('alert_rules')?.update({
          ...updates,
          updated_at: new Date()?.toISOString()
        })?.eq('id', alertId)?.eq('user_id', userId)?.select()?.single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  },

  async deleteAlertRule(alertId, userId) {
    try {
      const { error } = await supabase?.from('alert_rules')?.delete()?.eq('id', alertId)?.eq('user_id', userId);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  }
};

// Backtest Services
export const backtestService = {
  async getUserBacktests(userId) {
    try {
      const { data, error } = await supabase?.from('backtests')?.select('*')?.eq('user_id', userId)?.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  },

  async createBacktest(userId, backtestData) {
    try {
      // Calculate realistic backtest metrics based on historical opportunities
      const historicalOpportunities = await this.getHistoricalOpportunities(
        backtestData?.start_date, 
        backtestData?.end_date, 
        backtestData?.filters || {}
      );
      
      const calculatedMetrics = this.calculateBacktestMetrics(historicalOpportunities, backtestData);
      
      const { data, error } = await supabase?.from('backtests')?.insert({
          user_id: userId,
          name: backtestData?.name,
          start_date: backtestData?.start_date,
          end_date: backtestData?.end_date,
          min_spread_pct: backtestData?.min_spread_pct || 1.0,
          min_liquidity_usd: backtestData?.min_liquidity_usd || 500,
          venue_filter: backtestData?.venue_filter || [],
          ...calculatedMetrics
        })?.select()?.single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  },

  async getHistoricalOpportunities(startDate, endDate, filters = {}) {
    try {
      let query = supabase?.from('arbitrage_opportunities')?.select(`
          *,
          pair:market_pairs(
            *,
            market_a:market_a_id(
              *,
              venue:venues(*)
            ),
            market_b:market_b_id(
              *,
              venue:venues(*)
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
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  },

  async getPerformanceData(backtestId) {
    try {
      // Get backtest configuration
      const { data: backtest, error: backtestError } = await supabase?.from('backtests')?.select('*')?.eq('id', backtestId)?.single();
      
      if (backtestError) {
        throw backtestError;
      }

      // Get historical opportunities for the backtest period
      const opportunities = await this.getHistoricalOpportunities(
        backtest?.start_date, 
        backtest?.end_date,
        {
          min_spread_pct: backtest?.min_spread_pct,
          min_liquidity_usd: backtest?.min_liquidity_usd,
          venue_filter: backtest?.venue_filter
        }
      );

      // Calculate daily performance metrics
      const performanceData = this.generatePerformanceTimeSeries(opportunities, backtest);
      
      return performanceData;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  },

  async getVenueBreakdown(backtestId) {
    try {
      const { data: backtest } = await supabase?.from('backtests')?.select('*')?.eq('id', backtestId)?.single();
      
      const opportunities = await this.getHistoricalOpportunities(
        backtest?.start_date, 
        backtest?.end_date,
        {
          min_spread_pct: backtest?.min_spread_pct,
          min_liquidity_usd: backtest?.min_liquidity_usd
        }
      );

      return this.calculateVenueBreakdown(opportunities);
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  },

  async getCategoryAnalysis(backtestId) {
    try {
      const { data: backtest } = await supabase?.from('backtests')?.select('*')?.eq('id', backtestId)?.single();
      
      const opportunities = await this.getHistoricalOpportunities(
        backtest?.start_date, 
        backtest?.end_date,
        {
          min_spread_pct: backtest?.min_spread_pct,
          min_liquidity_usd: backtest?.min_liquidity_usd
        }
      );

      return this.calculateCategoryAnalysis(opportunities);
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  },

  calculateBacktestMetrics(opportunities, backtestData) {
    const totalOpportunities = opportunities?.length || 0;
    const profitableOpportunities = opportunities?.filter(opp => opp?.net_spread_pct > 0)?.length || 0;
    
    const avgSpread = opportunities?.length > 0 
      ? opportunities?.reduce((sum, opp) => sum + (parseFloat(opp?.net_spread_pct) || 0), 0) / opportunities?.length
      : 0;
    
    const totalProfitPct = avgSpread * profitableOpportunities / 100;
    const avgTradeSize = 1000; // Assumed average trade size
    const totalProfitUsd = totalProfitPct * avgTradeSize * profitableOpportunities;
    
    // Calculate Sharpe ratio (simplified)
    const dailyReturns = this.calculateDailyReturns(opportunities);
    const avgReturn = dailyReturns?.reduce((sum, ret) => sum + ret, 0) / (dailyReturns?.length || 1);
    const volatility = Math.sqrt(dailyReturns?.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / (dailyReturns?.length || 1));
    const sharpeRatio = volatility > 0 ? avgReturn / volatility : 0;
    
    // Calculate max drawdown
    const cumulativeReturns = this.calculateCumulativeReturns(dailyReturns);
    let maxDrawdown = this.calculateMaxDrawdown(cumulativeReturns);

    return {
      total_opportunities: totalOpportunities,
      profitable_opportunities: profitableOpportunities,
      total_profit_pct: parseFloat(totalProfitPct?.toFixed(4)),
      total_profit_usd: parseFloat(totalProfitUsd?.toFixed(2)),
      max_drawdown_pct: parseFloat(maxDrawdown?.toFixed(4)),
      sharpe_ratio: parseFloat(sharpeRatio?.toFixed(2))
    };
  },

  calculateDailyReturns(opportunities) {
    if (!opportunities?.length) return [0];
    
    // Group opportunities by date
    const dailyData = {};
    opportunities?.forEach(opp => {
      const date = opp?.created_at?.split('T')?.[0];
      if (!dailyData?.[date]) {
        dailyData[date] = [];
      }
      dailyData?.[date]?.push(parseFloat(opp?.net_spread_pct) || 0);
    });

    // Calculate daily returns
    return Object?.values(dailyData)?.map(dayOpps => 
      dayOpps?.reduce((sum, spread) => sum + spread, 0) / dayOpps?.length / 100
    );
  },

  calculateCumulativeReturns(dailyReturns) {
    const cumulative = [0];
    dailyReturns?.forEach((ret, i) => {
      cumulative?.push(cumulative?.[i] + ret);
    });
    return cumulative;
  },

  calculateMaxDrawdown(cumulativeReturns) {
    let maxDrawdown = 0;
    let peak = 0;
    
    cumulativeReturns?.forEach(ret => {
      if (ret > peak) {
        peak = ret;
      }
      const drawdown = peak - ret;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });
    
    return maxDrawdown;
  },

  generatePerformanceTimeSeries(opportunities, backtest) {
    if (!opportunities?.length) return [];
    
    // Group by date and calculate cumulative performance
    const dailyData = {};
    opportunities?.forEach(opp => {
      const date = opp?.created_at?.split('T')?.[0];
      if (!dailyData?.[date]) {
        dailyData[date] = {
          totalReturn: 0,
          count: 0,
          totalProfit: 0
        };
      }
      const spread = parseFloat(opp?.net_spread_pct) || 0;
      dailyData[date].totalReturn += spread / 100;
      dailyData[date].count += 1;
      dailyData[date].totalProfit += parseFloat(opp?.expected_profit_usd) || 0;
    });

    // Convert to time series
    const sortedDates = Object?.keys(dailyData)?.sort();
    let cumulativeReturn = 0;
    let peak = 0;

    return sortedDates?.map(date => {
      const dailyReturn = dailyData?.[date]?.totalReturn / dailyData?.[date]?.count;
      cumulativeReturn += dailyReturn;
      
      if (cumulativeReturn > peak) {
        peak = cumulativeReturn;
      }
      const drawdown = peak - cumulativeReturn;

      return {
        date,
        cumulativeReturn: parseFloat(cumulativeReturn?.toFixed(4)),
        dailyReturn: parseFloat(dailyReturn?.toFixed(4)),
        drawdown: -parseFloat(drawdown?.toFixed(4)),
        opportunityCount: dailyData?.[date]?.count,
        totalProfit: parseFloat(dailyData?.[date]?.totalProfit?.toFixed(2))
      };
    });
  },

  calculateVenueBreakdown(opportunities) {
    const venueStats = {};
    
    opportunities?.forEach(opp => {
      const venueA = opp?.pair?.market_a?.venue?.name;
      const venueB = opp?.pair?.market_b?.venue?.name;
      
      [venueA, venueB]?.forEach(venue => {
        if (!venue) return;
        
        if (!venueStats?.[venue]) {
          venueStats[venue] = {
            venue,
            totalProfit: 0,
            totalVolume: 0,
            opportunityCount: 0,
            totalSpread: 0,
            trades: []
          };
        }
        
        venueStats[venue].totalProfit += parseFloat(opp?.expected_profit_usd) || 0;
        venueStats[venue].totalVolume += parseFloat(opp?.max_tradable_amount) || 0;
        venueStats[venue].opportunityCount += 1;
        venueStats[venue].totalSpread += parseFloat(opp?.net_spread_pct) || 0;
        venueStats?.[venue]?.trades?.push(parseFloat(opp?.max_tradable_amount) || 0);
      });
    });

    return Object?.values(venueStats)?.map(venue => ({
      venue: venue?.venue,
      totalProfit: parseFloat(venue?.totalProfit?.toFixed(2)),
      totalVolume: parseFloat(venue?.totalVolume?.toFixed(2)),
      opportunityCount: venue?.opportunityCount,
      winRate: venue?.opportunityCount > 0 ? parseFloat((venue?.totalSpread / venue?.opportunityCount / 100)?.toFixed(2)) : 0,
      avgTradeSize: venue?.trades?.length > 0 
        ? parseFloat((venue?.trades?.reduce((sum, t) => sum + t, 0) / venue?.trades?.length)?.toFixed(0))
        : 0
    }))?.sort((a, b) => b?.totalProfit - a?.totalProfit);
  },

  calculateCategoryAnalysis(opportunities) {
    const categoryStats = {};
    
    opportunities?.forEach(opp => {
      const categoryA = opp?.pair?.market_a?.category;
      const categoryB = opp?.pair?.market_b?.category;
      
      [categoryA, categoryB]?.forEach(category => {
        if (!category) return;
        
        if (!categoryStats?.[category]) {
          categoryStats[category] = {
            category,
            totalReturn: 0,
            totalVolume: 0,
            tradeCount: 0,
            spreads: []
          };
        }
        
        const spread = parseFloat(opp?.net_spread_pct) || 0;
        categoryStats[category].totalReturn += spread / 100;
        categoryStats[category].totalVolume += parseFloat(opp?.max_tradable_amount) || 0;
        categoryStats[category].tradeCount += 1;
        categoryStats?.[category]?.spreads?.push(spread);
      });
    });

    return Object?.values(categoryStats)?.map(cat => ({
      category: cat?.category,
      totalReturn: parseFloat(cat?.totalReturn?.toFixed(4)),
      totalVolume: parseFloat(cat?.totalVolume?.toFixed(2)),
      tradeCount: cat?.tradeCount,
      winRate: cat?.spreads?.filter(s => s > 0)?.length / cat?.spreads?.length || 0,
      avgTradeSize: cat?.totalVolume / cat?.tradeCount || 0
    }))?.sort((a, b) => b?.totalReturn - a?.totalReturn);
  }
};

// System Settings Services
export const systemSettingsService = {
  async getUserSettings(userId) {
    try {
      const { data, error } = await supabase?.from('system_settings')?.select('*')?.eq('user_id', userId);
      
      if (error) {
        throw error;
      }
      
      // Convert array to object for easier access
      const settings = {};
      data?.forEach(setting => {
        settings[setting.setting_key] = setting?.setting_value;
      });
      
      return settings;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  },

  async updateUserSetting(userId, settingKey, settingValue) {
    try {
      const { data, error } = await supabase?.from('system_settings')?.upsert({
          user_id: userId,
          setting_key: settingKey,
          setting_value: settingValue,
          updated_at: new Date()?.toISOString()
        })?.select()?.single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive.');
      }
      throw error;
    }
  }
};

// Real-time subscriptions
export const subscriptionService = {
  subscribeToOpportunities(callback) {
    const channel = supabase?.channel('arbitrage_opportunities')?.on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'arbitrage_opportunities' 
        },
        (payload) => {
          callback?.(payload);
        }
      )?.subscribe();

    return () => supabase?.removeChannel(channel);
  },

  subscribeToMarkets(callback) {
    const channel = supabase?.channel('markets')?.on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'markets' 
        },
        (payload) => {
          callback?.(payload);
        }
      )?.subscribe();

    return () => supabase?.removeChannel(channel);
  }
};