import { supabase } from '../lib/supabase';
import cron from 'node-cron';

// Market Data Adapters for Different Exchanges
class PolymarketAdapter {
  constructor() {
    this.baseUrl = 'https://clob.polymarket.com/markets';
    this.venueId = null;
  }

  async initialize() {
    // Get Polymarket venue ID
    const { data } = await supabase?.from('venues')?.select('id')?.eq('name', 'Polymarket')?.single();
    this.venueId = data?.id;
    if (!this.venueId) {
      throw new Error('Polymarket venue not found in database');
    }
  }

  async fetchMarkets() {
    try {
      const response = await fetch(this.baseUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ArbLens/1.0'
        }
      });

      if (!response?.ok) {
        throw new Error(`Polymarket API error: ${response?.status}`);
      }

      const data = await response?.json();
      return this.parseMarkets(data?.data || []);
    } catch (error) {
      console.error('Error fetching Polymarket data:', error?.message);
      return [];
    }
  }

  parseMarkets(rawMarkets) {
    return rawMarkets?.filter(market => market?.active && market?.question)?.map(market => ({
      external_id: `poly_${market?.id}`,
      title: market?.question?.slice(0, 255),
      description: market?.description || null,
      venue_id: this.venueId,
      category: this.categorizeMarket(market?.question),
      yes_price: parseFloat(market?.yes_price || 0),
      no_price: parseFloat(market?.no_price || 0),
      yes_liquidity: parseFloat(market?.yes_liquidity || 0),
      no_liquidity: parseFloat(market?.no_liquidity || 0),
      volume_24h: parseFloat(market?.volume_24h || 0),
      status: 'active',
      market_url: `https://polymarket.com/event/${market?.slug}`,
      last_updated: new Date()?.toISOString()
    }));
  }

  categorizeMarket(question) {
    const q = question?.toLowerCase() || '';
    if (q?.includes('trump') || q?.includes('biden') || q?.includes('election') || q?.includes('president')) return 'Politics';
    if (q?.includes('bitcoin') || q?.includes('crypto') || q?.includes('ethereum')) return 'Crypto';
    if (q?.includes('sport') || q?.includes('nfl') || q?.includes('nba')) return 'Sports';
    if (q?.includes('ai') || q?.includes('tech') || q?.includes('apple')) return 'Technology';
    return 'Other';
  }
}

class KalshiAdapter {
  constructor() {
    this.baseUrl = 'https://api.kalshi.com/trade-api/v2';
    this.venueId = null;
  }

  async initialize() {
    const { data } = await supabase?.from('venues')?.select('id')?.eq('name', 'Kalshi')?.single();
    this.venueId = data?.id;
    if (!this.venueId) {
      throw new Error('Kalshi venue not found in database');
    }
  }

  async fetchMarkets() {
    try {
      const response = await fetch(`${this.baseUrl}/markets?limit=100&status=open`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ArbLens/1.0'
        }
      });

      if (!response?.ok) {
        throw new Error(`Kalshi API error: ${response?.status}`);
      }

      const data = await response?.json();
      return this.parseMarkets(data?.markets || []);
    } catch (error) {
      console.error('Error fetching Kalshi data:', error?.message);
      return [];
    }
  }

  parseMarkets(rawMarkets) {
    return rawMarkets?.filter(market => market?.status === 'open')?.map(market => ({
      external_id: `kalshi_${market?.ticker}`,
      title: market?.title?.slice(0, 255),
      description: market?.subtitle || null,
      venue_id: this.venueId,
      category: this.categorizeMarket(market?.title),
      yes_price: parseFloat(market?.yes_bid || 0) / 100,
      no_price: parseFloat(market?.no_bid || 0) / 100,
      yes_liquidity: parseFloat(market?.yes_ask_quantity || 0) * 100,
      no_liquidity: parseFloat(market?.no_ask_quantity || 0) * 100,
      volume_24h: parseFloat(market?.volume_24h || 0),
      status: 'active',
      market_url: `https://kalshi.com/events/${market?.event_ticker}/markets/${market?.ticker}`,
      last_updated: new Date()?.toISOString()
    }));
  }

  categorizeMarket(title) {
    const t = title?.toLowerCase() || '';
    if (t?.includes('election') || t?.includes('president') || t?.includes('congress')) return 'Politics';
    if (t?.includes('weather') || t?.includes('temperature') || t?.includes('hurricane')) return 'Weather';
    if (t?.includes('fed') || t?.includes('interest rate') || t?.includes('inflation')) return 'Economics';
    if (t?.includes('covid') || t?.includes('pandemic') || t?.includes('health')) return 'Health';
    return 'Other';
  }
}

class ManifoldAdapter {
  constructor() {
    this.baseUrl = 'https://api.manifold.markets/v0';
    this.venueId = null;
  }

  async initialize() {
    const { data } = await supabase?.from('venues')?.select('id')?.eq('name', 'Manifold')?.single();
    this.venueId = data?.id;
    if (!this.venueId) {
      // Create Manifold venue if it doesn't exist
      const { data: newVenue, error } = await supabase?.from('venues')?.insert({
        name: 'Manifold',
        venue_type: 'prediction_market',
        api_url: 'https://api.manifold.markets/v0',
        status: 'active',
        fee_bps: 0,
        supports_websocket: false
      })?.select()?.single();
      
      if (error) {
        throw new Error(`Failed to create Manifold venue: ${error?.message}`);
      }
      this.venueId = newVenue?.id;
    }
  }

  async fetchMarkets() {
    try {
      const response = await fetch(`${this.baseUrl}/markets?limit=100&sort=liquidity`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ArbLens/1.0'
        }
      });

      if (!response?.ok) {
        throw new Error(`Manifold API error: ${response?.status}`);
      }

      const data = await response?.json();
      return this.parseMarkets(data || []);
    } catch (error) {
      console.error('Error fetching Manifold data:', error?.message);
      return [];
    }
  }

  parseMarkets(rawMarkets) {
    return rawMarkets?.filter(market => 
      market?.isResolved === false && 
      market?.outcomeType === 'BINARY' &&
      market?.volume > 10
    )?.map(market => ({
      external_id: `manifold_${market?.id}`,
      title: market?.question?.slice(0, 255),
      description: market?.description?.slice(0, 500) || null,
      venue_id: this.venueId,
      category: this.categorizeMarket(market?.question),
      yes_price: parseFloat(market?.probability || 0),
      no_price: 1 - parseFloat(market?.probability || 0),
      yes_liquidity: parseFloat(market?.liquidity || 0),
      no_liquidity: parseFloat(market?.liquidity || 0),
      volume_24h: parseFloat(market?.volume24Hours || 0),
      status: 'active',
      market_url: market?.url,
      last_updated: new Date()?.toISOString()
    }));
  }

  categorizeMarket(question) {
    const q = question?.toLowerCase() || '';
    if (q?.includes('ai') || q?.includes('artificial intelligence') || q?.includes('gpt')) return 'Technology';
    if (q?.includes('bitcoin') || q?.includes('crypto') || q?.includes('ethereum')) return 'Crypto';
    if (q?.includes('election') || q?.includes('trump') || q?.includes('politics')) return 'Politics';
    if (q?.includes('climate') || q?.includes('temperature') || q?.includes('carbon')) return 'Environment';
    return 'Other';
  }
}

// Market Similarity Calculator using basic text matching
class MarketMatcher {
  constructor() {
    this.similarityThreshold = 0.7;
  }

  // Simple text similarity using Jaccard index
  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1?.toLowerCase()?.match(/\w+/g) || []);
    const words2 = new Set(text2?.toLowerCase()?.match(/\w+/g) || []);
    
    const intersection = new Set([...words1]?.filter(x => words2?.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union?.size > 0 ? intersection?.size / union?.size : 0;
  }

  // Enhanced similarity with key term matching
  calculateEnhancedSimilarity(market1, market2) {
    if (market1?.venue_id === market2?.venue_id) return 0; // Same venue
    if (market1?.category !== market2?.category) return 0; // Different categories
    
    const title1 = market1?.title || '';
    const title2 = market2?.title || '';
    
    // Extract key terms (people, events, dates)
    const keyTerms1 = this.extractKeyTerms(title1);
    const keyTerms2 = this.extractKeyTerms(title2);
    
    const titleSimilarity = this.calculateSimilarity(title1, title2);
    const keyTermSimilarity = this.calculateSimilarity(keyTerms1?.join(' '), keyTerms2?.join(' '));
    
    // Weighted combination
    return titleSimilarity * 0.7 + keyTermSimilarity * 0.3;
  }

  extractKeyTerms(text) {
    const terms = [];
    const lowerText = text?.toLowerCase();
    
    // Political figures
    const politicians = ['trump', 'biden', 'harris', 'desantis', 'newsom'];
    politicians?.forEach(pol => {
      if (lowerText?.includes(pol)) terms?.push(pol);
    });
    
    // Years and dates
    const years = lowerText?.match(/\b(2024|2025|2026)\b/g) || [];
    terms?.push(...years);
    
    // Common election terms
    const electionTerms = ['election', 'president', 'presidential', 'primary', 'general'];
    electionTerms?.forEach(term => {
      if (lowerText?.includes(term)) terms?.push(term);
    });
    
    return terms;
  }

  async findMarketPairs(markets) {
    const pairs = [];
    
    for (let i = 0; i < markets?.length; i++) {
      for (let j = i + 1; j < markets?.length; j++) {
        const market1 = markets?.[i];
        const market2 = markets?.[j];
        
        const similarity = this.calculateEnhancedSimilarity(market1, market2);
        
        if (similarity >= this.similarityThreshold) {
          pairs?.push({
            market_a_id: market1?.id,
            market_b_id: market2?.id,
            confidence_score: Math.round(similarity * 100),
            is_manual_override: false
          });
        }
      }
    }
    
    return pairs;
  }
}

// Arbitrage Opportunity Calculator
class ArbitrageCalculator {
  constructor() {
    this.minSpread = 0.01; // 1% minimum
    this.minLiquidity = 500; // $500 minimum
  }

  calculateOpportunities(marketPairs) {
    const opportunities = [];
    
    marketPairs?.forEach(pair => {
      const marketA = pair?.market_a;
      const marketB = pair?.market_b;
      
      if (!marketA || !marketB) return;
      
      // Calculate all possible arbitrage combinations
      const combinations = [
        // Buy Yes on A, Sell Yes on B
        {
          venue_a_side: 'yes',
          venue_b_side: 'yes',
          venue_a_price: marketA?.yes_price,
          venue_b_price: marketB?.yes_price,
          venue_a_liquidity: marketA?.yes_liquidity,
          venue_b_liquidity: marketB?.yes_liquidity
        },
        // Buy No on A, Sell No on B
        {
          venue_a_side: 'no',
          venue_b_side: 'no',
          venue_a_price: marketA?.no_price,
          venue_b_price: marketB?.no_price,
          venue_a_liquidity: marketA?.no_liquidity,
          venue_b_liquidity: marketB?.no_liquidity
        },
        // Buy Yes on A, Sell No on B (opposite outcome arbitrage)
        {
          venue_a_side: 'yes',
          venue_b_side: 'no',
          venue_a_price: marketA?.yes_price,
          venue_b_price: 1 - marketB?.no_price,
          venue_a_liquidity: marketA?.yes_liquidity,
          venue_b_liquidity: marketB?.no_liquidity
        },
        // Buy No on A, Sell Yes on B (opposite outcome arbitrage)
        {
          venue_a_side: 'no',
          venue_b_side: 'yes',
          venue_a_price: marketA?.no_price,
          venue_b_price: 1 - marketB?.yes_price,
          venue_a_liquidity: marketA?.no_liquidity,
          venue_b_liquidity: marketB?.yes_liquidity
        }
      ];
      
      let bestOpportunity = null;
      let maxSpread = 0;
      
      combinations?.forEach(combo => {
        const spread = combo?.venue_b_price - combo?.venue_a_price;
        if (spread > maxSpread) {
          maxSpread = spread;
          bestOpportunity = combo;
        }
      });
      
      if (bestOpportunity && maxSpread > 0) {
        // Calculate fees (simplified)
        const venueAFee = 0.02; // 2% fee
        const venueBFee = 0.02; // 2% fee
        
        const grossSpreadPct = (maxSpread / bestOpportunity?.venue_a_price) * 100;
        const netSpreadPct = grossSpreadPct - ((venueAFee + venueBFee) * 100);
        
        const maxTradableAmount = Math.min(
          bestOpportunity?.venue_a_liquidity || 0,
          bestOpportunity?.venue_b_liquidity || 0
        );
        
        if (netSpreadPct >= this.minSpread * 100 && maxTradableAmount >= this.minLiquidity) {
          opportunities?.push({
            pair_id: pair?.id,
            venue_a_side: bestOpportunity?.venue_a_side,
            venue_b_side: bestOpportunity?.venue_b_side,
            venue_a_price: bestOpportunity?.venue_a_price,
            venue_b_price: bestOpportunity?.venue_b_price,
            venue_a_liquidity: bestOpportunity?.venue_a_liquidity,
            venue_b_liquidity: bestOpportunity?.venue_b_liquidity,
            gross_spread_pct: parseFloat(grossSpreadPct?.toFixed(4)),
            net_spread_pct: parseFloat(netSpreadPct?.toFixed(4)),
            expected_profit_pct: parseFloat(netSpreadPct?.toFixed(4)),
            expected_profit_usd: parseFloat((netSpreadPct / 100 * maxTradableAmount)?.toFixed(2)),
            max_tradable_amount: parseFloat(maxTradableAmount?.toFixed(2)),
            risk_level: this.calculateRiskLevel(netSpreadPct, maxTradableAmount),
            status: 'active'
          });
        }
      }
    });
    
    return opportunities?.sort((a, b) => b?.net_spread_pct - a?.net_spread_pct);
  }

  calculateRiskLevel(spreadPct, liquidity) {
    if (spreadPct > 5 || liquidity < 1000) return 'high';
    if (spreadPct > 2 && liquidity > 5000) return 'low';
    return 'medium';
  }
}

// Main Data Ingestion Service
class DataIngestionService {
  constructor() {
    this.adapters = [
      new PolymarketAdapter(),
      new KalshiAdapter(),
      new ManifoldAdapter()
    ];
    this.matcher = new MarketMatcher();
    this.calculator = new ArbitrageCalculator();
    this.isRunning = false;
  }

  async initialize() {
    console.log('Initializing data ingestion service...');
    
    for (const adapter of this.adapters) {
      try {
        await adapter?.initialize();
        console.log(`${adapter?.constructor?.name} initialized successfully`);
      } catch (error) {
        console.error(`Failed to initialize ${adapter?.constructor?.name}:`, error?.message);
      }
    }
  }

  async syncAllMarkets() {
    if (this.isRunning) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting market data sync...');

    try {
      let allNewMarkets = [];
      
      // Fetch data from all adapters
      for (const adapter of this.adapters) {
        try {
          const markets = await adapter?.fetchMarkets();
          allNewMarkets?.push(...markets);
          console.log(`Fetched ${markets?.length} markets from ${adapter?.constructor?.name}`);
        } catch (error) {
          console.error(`Error fetching from ${adapter?.constructor?.name}:`, error?.message);
        }
      }

      if (allNewMarkets?.length === 0) {
        console.log('No new market data fetched');
        return;
      }

      // Upsert markets to database
      const { data: upsertedMarkets, error: upsertError } = await supabase
        ?.from('markets')
        ?.upsert(allNewMarkets, {
          onConflict: 'venue_id,external_id',
          ignoreDuplicates: false
        })
        ?.select();

      if (upsertError) {
        console.error('Error upserting markets:', upsertError?.message);
        return;
      }

      console.log(`Upserted ${upsertedMarkets?.length} markets to database`);

      // Get all active markets for pair matching
      const { data: allMarkets, error: fetchError } = await supabase
        ?.from('markets')
        ?.select('*')
        ?.eq('status', 'active');

      if (fetchError) {
        console.error('Error fetching markets for pairing:', fetchError?.message);
        return;
      }

      // Find market pairs
      const marketPairs = await this.matcher?.findMarketPairs(allMarkets);
      
      if (marketPairs?.length > 0) {
        // Upsert market pairs
        const { data: upsertedPairs, error: pairError } = await supabase
          ?.from('market_pairs')
          ?.upsert(marketPairs, {
            onConflict: 'market_a_id,market_b_id',
            ignoreDuplicates: false
          })
          ?.select(`
            *,
            market_a:market_a_id(*),
            market_b:market_b_id(*)
          `);

        if (pairError) {
          console.error('Error upserting market pairs:', pairError?.message);
          return;
        }

        console.log(`Upserted ${upsertedPairs?.length} market pairs`);

        // Calculate arbitrage opportunities
        const opportunities = this.calculator?.calculateOpportunities(upsertedPairs);
        
        if (opportunities?.length > 0) {
          // Clear old opportunities
          await supabase?.from('arbitrage_opportunities')?.delete()?.neq('id', '00000000-0000-0000-0000-000000000000');

          // Insert new opportunities
          const { data: insertedOpportunities, error: oppError } = await supabase
            ?.from('arbitrage_opportunities')
            ?.insert(opportunities)
            ?.select();

          if (oppError) {
            console.error('Error inserting opportunities:', oppError?.message);
          } else {
            console.log(`Inserted ${insertedOpportunities?.length} arbitrage opportunities`);
          }
        }
      }

      console.log('Market data sync completed successfully');
    } catch (error) {
      console.error('Critical error in market sync:', error?.message);
    } finally {
      this.isRunning = false;
    }
  }

  startScheduledSync() {
    console.log('Starting scheduled market data sync...');
    
    // Run every 2 minutes during market hours
    cron?.schedule('*/2 * * * *', async () => {
      console.log('Running scheduled market sync...');
      await this.syncAllMarkets();
    });

    // Initial sync
    setTimeout(() => {
      this.syncAllMarkets();
    }, 5000); // Wait 5 seconds after startup
  }

  async forceSync() {
    console.log('Forcing immediate market sync...');
    await this.syncAllMarkets();
  }
}

// Export singleton instance
export const dataIngestionService = new DataIngestionService();

// Auto-start if running in browser and not disabled
if (typeof window !== 'undefined' && !import.meta.env?.VITE_DISABLE_AUTO_INGESTION) {
  dataIngestionService?.initialize()?.then(() => {
    dataIngestionService?.startScheduledSync();
  })?.catch(error => {
    console.error('Failed to start data ingestion service:', error?.message);
  });
}

export default dataIngestionService;