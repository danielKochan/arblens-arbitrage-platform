import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/ui/Header';
import NavigationTabs from '../../components/ui/NavigationTabs';
import SettingsSidebar from './components/SettingsSidebar';
import ProfileSettings from './components/ProfileSettings';
import NotificationSettings from './components/NotificationSettings';
import DisplaySettings from './components/DisplaySettings';
import TradingSettings from './components/TradingSettings';
import SecuritySettings from './components/SecuritySettings';
import BackupSettings from './components/BackupSettings';
import Icon from '../../components/AppIcon';

const SystemSettings = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'display':
        return <DisplaySettings />;
      case 'trading':
        return <TradingSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'backup':
        return <BackupSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  const getSectionTitle = () => {
    const titles = {
      profile: 'Profile Settings',
      notifications: 'Notification Preferences',
      display: 'Display & Formatting',
      trading: 'Trading Preferences',
      security: 'Security & Authentication',
      backup: 'Backup & Export'
    };
    return titles?.[activeSection] || 'Settings';
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setIsMobileSidebarOpen(false); // Close mobile sidebar after selection
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NavigationTabs />
      <div className="pt-32">
        <div className="max-w-7xl mx-auto px-6">
          {/* Mobile Header */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-heading font-bold text-foreground">
                {getSectionTitle()}
              </h1>
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors duration-150"
              >
                <Icon name="Menu" size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-8rem)]">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block lg:col-span-3">
              <div className="sticky top-32">
                <SettingsSidebar 
                  activeSection={activeSection} 
                  onSectionChange={handleSectionChange} 
                />
              </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
              <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)}>
                <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[80vw] bg-background" onClick={(e) => e?.stopPropagation()}>
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-heading font-semibold">Settings</h2>
                    <button
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="p-1 text-text-secondary hover:text-text-primary"
                    >
                      <Icon name="X" size={18} />
                    </button>
                  </div>
                  <SettingsSidebar 
                    activeSection={activeSection} 
                    onSectionChange={handleSectionChange} 
                  />
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="lg:col-span-9">
              <div className="bg-card border border-border rounded-lg min-h-[600px]">
                <div className="p-6">
                  {/* Desktop Header */}
                  <div className="hidden lg:block mb-6">
                    <h1 className="text-2xl font-heading font-bold text-card-foreground">
                      {getSectionTitle()}
                    </h1>
                  </div>

                  {/* Settings Content */}
                  <div className="max-w-4xl">
                    {renderActiveSection()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Bottom Navigation */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
            <div className="flex overflow-x-auto">
              {[
                { id: 'profile', icon: 'User', label: 'Profile' },
                { id: 'notifications', icon: 'Bell', label: 'Alerts' },
                { id: 'display', icon: 'Monitor', label: 'Display' },
                { id: 'trading', icon: 'TrendingUp', label: 'Trading' },
                { id: 'security', icon: 'Shield', label: 'Security' },
                { id: 'backup', icon: 'Download', label: 'Backup' }
              ]?.map((item) => (
                <button
                  key={item?.id}
                  onClick={() => handleSectionChange(item?.id)}
                  className={`
                    flex-1 min-w-0 px-3 py-3 text-center transition-colors duration-150
                    ${activeSection === item?.id
                      ? 'text-primary bg-primary/10 border-t-2 border-primary' :'text-text-secondary hover:text-text-primary'
                    }
                  `}
                >
                  <Icon 
                    name={item?.icon} 
                    size={18} 
                    color={activeSection === item?.id ? 'var(--color-primary)' : 'var(--color-text-secondary)'} 
                    className="mx-auto mb-1"
                  />
                  <div className="text-xs font-medium truncate">
                    {item?.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Bottom Padding */}
          <div className="lg:hidden h-20"></div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;