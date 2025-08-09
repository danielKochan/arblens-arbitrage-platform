import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import BacktestAnalysis from './pages/backtest-analysis';
import ArbitrageDashboard from './pages/arbitrage-dashboard';
import ApiManagement from './pages/api-management';
import SystemSettings from './pages/system-settings';
import ArbitrageCalculator from './pages/arbitrage-calculator';
import MarketPairManagement from './pages/market-pair-management';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<ApiManagement />} />
        <Route path="/backtest-analysis" element={<BacktestAnalysis />} />
        <Route path="/arbitrage-dashboard" element={<ArbitrageDashboard />} />
        <Route path="/api-management" element={<ApiManagement />} />
        <Route path="/system-settings" element={<SystemSettings />} />
        <Route path="/arbitrage-calculator" element={<ArbitrageCalculator />} />
        <Route path="/market-pair-management" element={<MarketPairManagement />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
