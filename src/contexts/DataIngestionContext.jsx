import React, { createContext, useContext, useState, useEffect } from 'react';
import { DataIngestionUtils } from '../utils/dataIngestionUtils';

const DataIngestionContext = createContext();

export const useDataIngestion = () => {
  const context = useContext(DataIngestionContext);
  if (!context) {
    throw new Error('useDataIngestion must be used within a DataIngestionProvider');
  }
  return context;
};

export const DataIngestionProvider = ({ children }) => {
  const [status, setStatus] = useState({
    isInitialized: false,
    isHealthy: false,
    healthStatus: 'unknown',
    dataStats: null,
    ingestionService: null,
    lastUpdate: null,
    error: null
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [opportunities, setOpportunities] = useState([]);

  // Initialize the data ingestion system
  useEffect(() => {
    let isMounted = true;
    let monitoringCleanup = null;

    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Initialize the data ingestion system
        await DataIngestionUtils?.initialize();
        
        // Get initial status
        const initialStatus = await DataIngestionUtils?.getStatus();
        
        if (isMounted) {
          setStatus(prev => ({
            ...prev,
            isInitialized: true,
            healthStatus: initialStatus?.healthStatus,
            dataStats: initialStatus?.dataStats,
            ingestionService: initialStatus?.ingestionService,
            lastUpdate: new Date(),
            error: null
          }));
        }

        // Setup real-time monitoring
        monitoringCleanup = DataIngestionUtils?.setupMonitoring((update) => {
          if (!isMounted) return;
          
          if (update?.type === 'health_check') {
            setStatus(prev => ({
              ...prev,
              healthStatus: update?.status?.healthStatus,
              dataStats: update?.status?.dataStats,
              ingestionService: update?.status?.ingestionService,
              lastUpdate: new Date(),
              isHealthy: update?.status?.healthStatus === 'healthy'
            }));
          } else if (update?.type === 'market_data') {
            // Refresh opportunities when market data changes
            refreshOpportunities();
          }
        });

        // Load initial opportunities
        await refreshOpportunities();

      } catch (error) {
        console.error('Failed to initialize data ingestion:', error?.message);
        
        if (isMounted) {
          setStatus(prev => ({
            ...prev,
            isInitialized: false,
            healthStatus: 'error',
            error: error?.message,
            lastUpdate: new Date()
          }));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const refreshOpportunities = async () => {
      try {
        const formattedOpportunities = await DataIngestionUtils?.getOpportunities({
          min_spread: 1.0,
          min_liquidity: 500,
          limit: 50
        });
        
        if (isMounted) {
          setOpportunities(formattedOpportunities);
        }
      } catch (error) {
        console.error('Failed to refresh opportunities:', error?.message);
      }
    };

    initialize();

    return () => {
      isMounted = false;
      monitoringCleanup?.();
    };
  }, []);

  // Manual refresh function
  const refresh = async () => {
    try {
      setIsLoading(true);
      
      await DataIngestionUtils?.refresh();
      
      const newStatus = await DataIngestionUtils?.getStatus();
      const newOpportunities = await DataIngestionUtils?.getOpportunities({
        min_spread: 1.0,
        min_liquidity: 500,
        limit: 50
      });
      
      setStatus(prev => ({
        ...prev,
        healthStatus: newStatus?.healthStatus,
        dataStats: newStatus?.dataStats,
        ingestionService: newStatus?.ingestionService,
        lastUpdate: new Date(),
        isHealthy: newStatus?.healthStatus === 'healthy',
        error: null
      }));
      
      setOpportunities(newOpportunities);
      
      return { success: true, timestamp: new Date() };
    } catch (error) {
      console.error('Failed to refresh data:', error?.message);
      
      setStatus(prev => ({
        ...prev,
        error: error?.message,
        lastUpdate: new Date()
      }));
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Validate data quality
  const validateQuality = async () => {
    try {
      return await DataIngestionUtils?.validateQuality();
    } catch (error) {
      console.error('Failed to validate data quality:', error?.message);
      return {
        isValid: false,
        issues: [error?.message],
        timestamp: new Date()?.toISOString()
      };
    }
  };

  // Perform system maintenance
  const performMaintenance = async () => {
    try {
      setIsLoading(true);
      
      const result = await DataIngestionUtils?.performMaintenance();
      
      // Update status after maintenance
      const newStatus = await DataIngestionUtils?.getStatus();
      setStatus(prev => ({
        ...prev,
        healthStatus: newStatus?.healthStatus,
        dataStats: newStatus?.dataStats,
        lastUpdate: new Date(),
        isHealthy: newStatus?.healthStatus === 'healthy'
      }));
      
      return result;
    } catch (error) {
      console.error('Maintenance failed:', error?.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get opportunities with custom filters
  const getOpportunities = async (filters = {}) => {
    try {
      return await DataIngestionUtils?.getOpportunities(filters);
    } catch (error) {
      console.error('Failed to get opportunities:', error?.message);
      return [];
    }
  };

  const value = {
    // Status
    status,
    isLoading,
    isInitialized: status?.isInitialized,
    isHealthy: status?.isHealthy,
    
    // Data
    opportunities,
    dataStats: status?.dataStats,
    
    // Actions
    refresh,
    validateQuality,
    performMaintenance,
    getOpportunities,
    
    // Utilities
    lastUpdate: status?.lastUpdate,
    error: status?.error
  };

  return (
    <DataIngestionContext.Provider value={value}>
      {children}
    </DataIngestionContext.Provider>
  );
};

export default DataIngestionProvider;