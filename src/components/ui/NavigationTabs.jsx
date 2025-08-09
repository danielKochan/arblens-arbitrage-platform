import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const NavigationTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location?.pathname;

  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/arbitrage-dashboard',
      icon: 'BarChart3',
      description: 'Arbitrage opportunities'
    },
    {
      label: 'Calculator',
      path: '/arbitrage-calculator',
      icon: 'Calculator',
      description: 'Profit analysis'
    },
    {
      label: 'Analytics',
      path: '/backtest-analysis',
      icon: 'TrendingUp',
      description: 'Historical analysis'
    },
    {
      label: 'Management',
      path: '/market-pair-management',
      icon: 'Settings2',
      description: 'Market pairs'
    },
    {
      label: 'Settings',
      path: '/system-settings',
      icon: 'Cog',
      description: 'System configuration',
      subPaths: ['/api-management']
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (item) => {
    if (item?.path === currentPath) return true;
    if (item?.subPaths && item?.subPaths?.includes(currentPath)) return true;
    return false;
  };

  return (
    <nav className="sticky top-16 z-[999] bg-background border-b border-border">
      <div className="px-6">
        <div className="flex space-x-0">
          {navigationItems?.map((item) => {
            const active = isActive(item);
            
            return (
              <button
                key={item?.path}
                onClick={() => handleNavigation(item?.path)}
                className={`
                  relative flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-all duration-150 ease-out
                  border-b-2 hover:bg-muted/50
                  ${active 
                    ? 'text-primary border-primary bg-muted/30' :'text-text-secondary border-transparent hover:text-text-primary'
                  }
                `}
              >
                <Icon 
                  name={item?.icon} 
                  size={16} 
                  color={active ? 'var(--color-primary)' : 'var(--color-text-secondary)'} 
                />
                <span className="hidden sm:inline">{item?.label}</span>
                {/* Mobile: Show icon only with tooltip */}
                <span className="sm:hidden sr-only">{item?.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default NavigationTabs;