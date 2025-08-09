import React from 'react';
import Icon from '../../../components/AppIcon';

const SettingsSidebar = ({ activeSection, onSectionChange }) => {
  const settingsCategories = [
    {
      id: 'profile',
      label: 'Profile',
      icon: 'User',
      description: 'Account information and regional settings'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: 'Bell',
      description: 'Alert preferences and delivery settings'
    },
    {
      id: 'display',
      label: 'Display',
      icon: 'Monitor',
      description: 'Theme, currency, and formatting options'
    },
    {
      id: 'trading',
      label: 'Trading Preferences',
      icon: 'TrendingUp',
      description: 'Default venues and risk settings'
    },
    {
      id: 'security',
      label: 'Security',
      icon: 'Shield',
      description: 'Password and authentication settings'
    },
    {
      id: 'backup',
      label: 'Backup & Export',
      icon: 'Download',
      description: 'Settings backup and team sync'
    }
  ];

  return (
    <div className="bg-card border-r border-border h-full">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-heading font-semibold text-card-foreground">
          Settings
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Manage your preferences and configuration
        </p>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          {settingsCategories?.map((category) => (
            <li key={category?.id}>
              <button
                onClick={() => onSectionChange(category?.id)}
                className={`
                  w-full flex items-start space-x-3 p-3 rounded-lg text-left transition-all duration-150
                  ${activeSection === category?.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-card-foreground hover:bg-muted'
                  }
                `}
              >
                <Icon 
                  name={category?.icon} 
                  size={18} 
                  color={activeSection === category?.id ? 'var(--color-primary-foreground)' : 'var(--color-text-secondary)'} 
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium font-heading">
                    {category?.label}
                  </div>
                  <div className={`text-xs mt-0.5 ${
                    activeSection === category?.id 
                      ? 'text-primary-foreground/80' 
                      : 'text-text-secondary'
                  }`}>
                    {category?.description}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default SettingsSidebar;