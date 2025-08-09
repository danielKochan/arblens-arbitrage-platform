// Backend API service layer with failover to Supabase
import supabaseServices from './supabaseServices.js';

const BACKEND_BASE_URL = import.meta.env?.VITE_BACKEND_API_URL || 'https://arblens-backend.onrender.com';
const BACKEND_TIMEOUT = 8000; // Increased to 8 second timeout
const USE_BACKEND_FALLBACK = import.meta.env?.VITE_USE_BACKEND_FALLBACK !== 'false';
const MAX_RETRY_ATTEMPTS = 2; // Add retry attempts

// Backend health status
let backendHealthStatus = 'unknown'; // 'healthy', 'unhealthy', 'unknown'
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

// Connection retry with exponential backoff
const retryWithBackoff = async (fn, attempt = 1) => {
  try {
    return await fn();
  } catch (error) {
    if (attempt >= MAX_RETRY_ATTEMPTS) {
      throw error;
    }
    
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 second delay
    console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, attempt + 1);
  }
};

// Enhanced helper function to check backend health with better error handling
const checkBackendHealth = async () => {
  const now = Date.now();
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL && backendHealthStatus !== 'unknown') {
    return backendHealthStatus === 'healthy';
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller?.abort(), 5000); // Reduced timeout for health check
    
    const response = await fetch(`${BACKEND_BASE_URL}/health`, {
      signal: controller?.signal,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      mode: 'cors'
    });
    
    clearTimeout(timeoutId);
    
    if (response?.ok) {
      backendHealthStatus = 'healthy';
      lastHealthCheck = now;
      return true;
    } else {
      backendHealthStatus = 'unhealthy';
      lastHealthCheck = now;
      console.warn(`Backend health check failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    backendHealthStatus = 'unhealthy';
    lastHealthCheck = now;
    
    if (error?.name === 'AbortError') {
      console.warn('Backend health check timeout');
    } else if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
      console.warn('Backend server unreachable');
    } else {
      console.warn('Backend health check failed:', error?.message);
    }
    return false;
  }
};

// Enhanced helper function to handle API responses and errors
const handleApiResponse = async (response) => {
  if (!response?.ok) {
    let errorMessage;
    
    try {
      const errorText = await response?.text();
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    } catch {
      errorMessage = `Backend server returned ${response.status}: ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }
  
  try {
    return await response?.json();
  } catch {
    throw new Error('Invalid response format from backend server');
  }
};

// Enhanced helper function to make API request with better timeout and error handling
const makeApiRequest = async (url, options = {}) => {
  const requestFn = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller?.abort(), BACKEND_TIMEOUT);
    
    try {
      const response = await fetch(`${BACKEND_BASE_URL}${url}`, {
        signal: controller?.signal,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          ...options?.headers,
        },
        mode: 'cors',
        ...options,
      });
      
      clearTimeout(timeoutId);
      return handleApiResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Enhanced error categorization
      if (error?.name === 'AbortError') {
        throw new Error(`Backend server timeout: Request took longer than ${BACKEND_TIMEOUT/1000} seconds`);
      }
      
      if (error?.message?.includes('Failed to fetch') || 
          error?.name === 'TypeError'|| error?.message?.includes('NetworkError') ||
          error?.message?.includes('net::ERR_')) {
        backendHealthStatus = 'unhealthy';
        throw new Error('Cannot connect to backend server. Server may be down, restarting, or experiencing high traffic.');
      }
      
      if (error?.message?.includes('CORS')) {
        throw new Error('Backend server CORS configuration issue. Please try again later.');
      }
      
      throw error;
    }
  };

  return await retryWithBackoff(requestFn);
};

// Enhanced helper function to execute with fallback
const executeWithFallback = async (backendFn, supabaseFn, serviceName) => {
  if (!USE_BACKEND_FALLBACK) {
    console.log(`${serviceName}: Using Supabase only (backend fallback disabled)`);
    try {
      return await supabaseFn();
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        throw new Error('Cannot connect to database. Your Supabase project may be paused or inactive. Please check your Supabase dashboard and resume your project if needed.');
      }
      throw error;
    }
  }

  try {
    const result = await backendFn();
    return result;
  } catch (error) {
    console.warn(`${serviceName}: Backend failed (${error?.message}), attempting Supabase fallback...`);
    
    // Only fallback for connection/infrastructure issues
    if (error?.message?.includes('Cannot connect to backend server') || 
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('NetworkError') ||
        error?.message?.includes('CORS') ||
        error?.message?.includes('net::ERR_')) {
      
      try {
        const result = await supabaseFn();
        console.log(`${serviceName}: Supabase fallback successful`);
        return result;
      } catch (fallbackError) {
        console.error(`${serviceName}: Both backend and Supabase failed:`, {
          backend: error?.message,
          supabase: fallbackError?.message
        });
        
        // Provide user-friendly combined error message
        if (fallbackError?.message?.includes('Supabase project may be paused')) {
          throw new Error('Both backend server and Supabase database are currently unavailable. Please try again later or contact support.');
        }
        
        throw new Error(`Service temporarily unavailable. Backend: ${error?.message?.slice(0, 100)}. Database: ${fallbackError?.message?.slice(0, 100)}`);
      }
    }
    
    // Re-throw non-connection errors (authentication, validation, etc.)
    throw error;
  }
};

// Venue Services with fallback
export const venueService = {
  async getVenues() {
    const backendFn = async () => {
      const data = await makeApiRequest('/api/v1/venues');
      return data?.venues || [];
    };

    const supabaseFn = async () => {
      return await supabaseServices?.venueService?.getVenues();
    };

    return executeWithFallback(backendFn, supabaseFn, 'getVenues');
  },

  async getActiveVenues() {
    const backendFn = async () => {
      const data = await makeApiRequest('/api/v1/venues?status=active');
      return data?.venues || [];
    };

    const supabaseFn = async () => {
      return await supabaseServices?.venueService?.getActiveVenues();
    };

    return executeWithFallback(backendFn, supabaseFn, 'getActiveVenues');
  }
};

// Market Services with fallback
export const marketService = {
  async getMarkets(filters = {}) {
    const backendFn = async () => {
      const params = new URLSearchParams();
      
      if (filters?.venue_id) params?.append('venue_id', filters?.venue_id);
      if (filters?.status) params?.append('status', filters?.status);
      if (filters?.category) params?.append('category', filters?.category);
      if (filters?.limit) params?.append('limit', filters?.limit);

      const queryString = params?.toString();
      const url = `/api/v1/markets${queryString ? `?${queryString}` : ''}`;
      
      const data = await makeApiRequest(url);
      return data?.markets || [];
    };

    const supabaseFn = async () => {
      return await supabaseServices?.marketService?.getMarkets(filters);
    };

    return executeWithFallback(backendFn, supabaseFn, 'getMarkets');
  },

  async getMarketById(marketId) {
    const backendFn = async () => {
      return await makeApiRequest(`/api/v1/markets/${marketId}`);
    };

    const supabaseFn = async () => {
      return await supabaseServices?.marketService?.getMarketById(marketId);
    };

    return executeWithFallback(backendFn, supabaseFn, 'getMarketById');
  }
};

// Arbitrage Opportunities Services with fallback
export const arbitrageService = {
  async getOpportunities(filters = {}) {
    const backendFn = async () => {
      const params = new URLSearchParams();
      
      if (filters?.min_spread) params?.append('min_spread', filters?.min_spread);
      if (filters?.min_liquidity) params?.append('min_liquidity', filters?.min_liquidity);
      if (filters?.venues?.length > 0) params?.append('venues', filters?.venues?.join(','));
      if (filters?.category) params?.append('category', filters?.category);
      if (filters?.limit) params?.append('limit', filters?.limit);
      if (filters?.status) params?.append('status', filters?.status);

      const queryString = params?.toString();
      const url = `/api/v1/opportunities${queryString ? `?${queryString}` : ''}`;
      
      const data = await makeApiRequest(url);
      return data?.opportunities || [];
    };

    const supabaseFn = async () => {
      return await supabaseServices?.arbitrageService?.getOpportunities(filters);
    };

    return executeWithFallback(backendFn, supabaseFn, 'getOpportunities');
  },

  async getOpportunityById(opportunityId) {
    const backendFn = async () => {
      return await makeApiRequest(`/api/v1/opportunities/${opportunityId}`);
    };

    const supabaseFn = async () => {
      return await supabaseServices?.arbitrageService?.getOpportunityById(opportunityId);
    };

    return executeWithFallback(backendFn, supabaseFn, 'getOpportunityById');
  }
};

// Market Pair Services - Supabase only (backend doesn't support this yet)
export const marketPairService = {
  async getMarketPairs(filters = {}) {
    return await supabaseServices?.marketPairService?.getMarketPairs(filters);
  },

  async approvePair(pairId, userId) {
    return await supabaseServices?.marketPairService?.approvePair(pairId, userId);
  }
};

// Backtest Services with fallback
export const backtestService = {
  async getUserBacktests(userId) {
    const backendFn = async () => {
      const data = await makeApiRequest(`/api/v1/backtests?user_id=${userId}`);
      return data?.backtests || [];
    };

    const supabaseFn = async () => {
      return await supabaseServices?.backtestService?.getUserBacktests(userId);
    };

    return executeWithFallback(backendFn, supabaseFn, 'getUserBacktests');
  },

  async createBacktest(userId, backtestData) {
    const backendFn = async () => {
      const requestData = {
        user_id: userId,
        ...backtestData
      };

      return await makeApiRequest('/api/v1/backtests', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    };

    const supabaseFn = async () => {
      return await supabaseServices?.backtestService?.createBacktest(userId, backtestData);
    };

    return executeWithFallback(backendFn, supabaseFn, 'createBacktest');
  },

  async getBacktestResults(backtestId) {
    const supabaseFn = async () => {
      // Always use Supabase for backtest results as it has more complete implementation
      const { data, error } = await supabaseServices?.supabase?.from('backtests')?.select('*')?.eq('id', backtestId)?.single();
      if (error) throw error;
      return data;
    };

    return supabaseFn();
  },

  async getHistoricalOpportunities(startDate, endDate, filters = {}) {
    const backendFn = async () => {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        limit: 5000,
        status: 'completed'
      });

      if (filters?.min_spread_pct) params?.append('min_spread', filters?.min_spread_pct);
      if (filters?.min_liquidity_usd) params?.append('min_liquidity', filters?.min_liquidity_usd);
      if (filters?.venue_filter?.length > 0) params?.append('venues', filters?.venue_filter?.join(','));

      const data = await makeApiRequest(`/api/v1/opportunities?${params?.toString()}`);
      return data?.opportunities || [];
    };

    const supabaseFn = async () => {
      return await supabaseServices?.backtestService?.getHistoricalOpportunities(startDate, endDate, filters);
    };

    return executeWithFallback(backendFn, supabaseFn, 'getHistoricalOpportunities');
  },

  async getPerformanceData(backtestId) {
    return await supabaseServices?.backtestService?.getPerformanceData(backtestId);
  },

  async getVenueBreakdown(backtestId) {
    return await supabaseServices?.backtestService?.getVenueBreakdown(backtestId);
  },

  async getCategoryAnalysis(backtestId) {
    return await supabaseServices?.backtestService?.getCategoryAnalysis(backtestId);
  }
};

// API Key Services - Supabase only
export const apiKeyService = {
  async getUserApiKeys(userId) {
    return await supabaseServices?.apiKeyService?.getUserApiKeys(userId);
  },

  async createApiKey(userId, keyName, tier = 'free') {
    return await supabaseServices?.apiKeyService?.createApiKey(userId, keyName, tier);
  },

  async deleteApiKey(apiKeyId, userId) {
    return await supabaseServices?.apiKeyService?.deleteApiKey(apiKeyId, userId);
  }
};

// Alert Services - Supabase only
export const alertService = {
  async getUserAlertRules(userId) {
    return await supabaseServices?.alertService?.getUserAlertRules(userId);
  },

  async createAlertRule(userId, alertData) {
    return await supabaseServices?.alertService?.createAlertRule(userId, alertData);
  },

  async updateAlertRule(alertId, userId, updates) {
    return await supabaseServices?.alertService?.updateAlertRule(alertId, userId, updates);
  },

  async deleteAlertRule(alertId, userId) {
    return await supabaseServices?.alertService?.deleteAlertRule(alertId, userId);
  }
};

// System Settings Services - Supabase only
export const systemSettingsService = {
  async getUserSettings(userId) {
    return await supabaseServices?.systemSettingsService?.getUserSettings(userId);
  },

  async updateUserSetting(userId, settingKey, settingValue) {
    return await supabaseServices?.systemSettingsService?.updateUserSetting(userId, settingKey, settingValue);
  }
};

// Platform Statistics with fallback
export const statsService = {
  async getPlatformStats() {
    const backendFn = async () => {
      const data = await makeApiRequest('/api/v1/stats');
      return data?.stats || {};
    };

    const supabaseFn = async () => {
      // Generate basic stats from Supabase data
      try {
        const venues = await supabaseServices?.venueService?.getVenues();
        const opportunities = await supabaseServices?.arbitrageService?.getOpportunities({ limit: 100 });
        
        return {
          totalVenues: venues?.length || 0,
          activeOpportunities: opportunities?.length || 0,
          avgSpread: opportunities?.length > 0 
            ? opportunities?.reduce((sum, opp) => sum + (parseFloat(opp?.net_spread_pct) || 0), 0) / opportunities?.length 
            : 0,
          totalVolume: opportunities?.reduce((sum, opp) => sum + (parseFloat(opp?.max_tradable_amount) || 0), 0) || 0
        };
      } catch (error) {
        console.error('Failed to generate platform stats:', error);
        return {
          totalVenues: 0,
          activeOpportunities: 0,
          avgSpread: 0,
          totalVolume: 0
        };
      }
    };

    return executeWithFallback(backendFn, supabaseFn, 'getPlatformStats');
  }
};

// Real-time subscriptions with fallback
export const subscriptionService = {
  subscribeToOpportunities(callback) {
    if (backendHealthStatus === 'healthy') {
      console.warn('Real-time subscriptions not supported by backend API. Using Supabase real-time instead.');
    }
    
    // Always use Supabase for real-time subscriptions
    return supabaseServices?.subscriptionService?.subscribeToOpportunities(callback);
  },

  subscribeToMarkets(callback) {
    if (backendHealthStatus === 'healthy') {
      console.warn('Real-time market subscriptions not supported by backend API. Using Supabase real-time instead.');
    }
    
    // Always use Supabase for real-time subscriptions  
    return supabaseServices?.subscriptionService?.subscribeToMarkets(callback);
  }
};

// Enhanced health check utility
export const healthService = {
  async checkBackendHealth() {
    return await checkBackendHealth();
  },

  getBackendStatus() {
    return {
      status: backendHealthStatus,
      lastCheck: lastHealthCheck,
      lastCheckAgo: lastHealthCheck > 0 ? Date.now() - lastHealthCheck : null,
      usingFallback: USE_BACKEND_FALLBACK,
      backendUrl: BACKEND_BASE_URL,
      timeout: BACKEND_TIMEOUT,
      nextCheckIn: lastHealthCheck > 0 ? Math.max(0, HEALTH_CHECK_INTERVAL - (Date.now() - lastHealthCheck)) : 0
    };
  },

  async forceHealthCheck() {
    lastHealthCheck = 0;
    backendHealthStatus = 'unknown';
    const result = await checkBackendHealth();
    
    // Also try a basic API call to verify full connectivity
    if (result) {
      try {
        await makeApiRequest('/api/v1/stats');
        console.log('Backend connectivity fully verified');
      } catch (error) {
        console.warn('Backend health check passed but API call failed:', error?.message);
        backendHealthStatus = 'unhealthy';
        return false;
      }
    }
    
    return result;
  },

  async testConnection() {
    try {
      const startTime = Date.now();
      const result = await this.forceHealthCheck();
      const latency = Date.now() - startTime;
      
      return {
        connected: result,
        latency,
        status: backendHealthStatus,
        url: BACKEND_BASE_URL
      };
    } catch (error) {
      return {
        connected: false,
        latency: null,
        status: 'failed',
        url: BACKEND_BASE_URL,
        error: error?.message
      };
    }
  }
};

// Initialize health check on service load with better error handling
if (USE_BACKEND_FALLBACK) {
  checkBackendHealth()?.catch(error => {
    console.warn('Initial backend health check failed, will use Supabase fallback:', error?.message);
  });
}

export default {
  venueService,
  marketService,
  arbitrageService,
  marketPairService,
  backtestService,
  apiKeyService,
  alertService,
  systemSettingsService,
  statsService,
  subscriptionService,
  healthService
};