import React, { useState, useEffect } from "react";
import { Header } from "../../components/ui/Header";
import Button from '../../components/ui/Button';
import { ApiKeyCard } from "./components/ApiKeyCard";
import CreateApiKeyModal from './components/CreateApiKeyModal';
import UsageAnalytics from './components/UsageAnalytics';

import ApiDocumentation from './components/ApiDocumentation';
import { Plus, Key, BarChart3, BookOpen, AlertCircle } from "lucide-react";
import { apiKeyService } from "../../utils/supabaseServices";
import { useAuth } from "../../contexts/AuthContext";
import { AuthModal } from "../../components/auth/AuthModal";
import NotificationToast from '../../components/ui/NotificationToast';
import Icon from '../../components/AppIcon';


export default function ApiManagement() {
  const [activeTab, setActiveTab] = useState("keys");
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadApiKeys();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiKeyService?.getUserApiKeys(user?.id);
      setApiKeys(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async (keyData) => {
    try {
      const newKey = await apiKeyService?.createApiKey(user?.id, keyData?.name, keyData?.tier);
      setApiKeys(prev => [newKey, ...prev]);
      setShowCreateModal(false);
      showNotification('API key created successfully!', 'success');
    } catch (error) {
      showNotification(error?.message || 'Failed to create API key', 'error');
    }
  };

  const handleDeleteApiKey = async (keyId) => {
    try {
      await apiKeyService?.deleteApiKey(keyId, user?.id);
      setApiKeys(prev => prev?.filter(key => key?.id !== keyId));
      showNotification('API key deleted successfully!', 'success');
    } catch (error) {
      showNotification(error?.message || 'Failed to delete API key', 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const tabs = [
    { id: "keys", label: "API Keys", icon: Key },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "docs", label: "Documentation", icon: BookOpen }
  ];

  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="ArbLens - API Management" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Show auth required state for non-authenticated users
  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gray-50">
          <Header title="ArbLens - API Management" />
          
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Key className="h-8 w-8 text-blue-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                API Management
              </h2>
              
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Manage your API keys, monitor usage, and access our comprehensive API documentation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <Key className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Secure API Keys</h3>
                  <p className="text-sm text-gray-600">Generate and manage your API keys securely</p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Usage Analytics</h3>
                  <p className="text-sm text-gray-600">Track your API usage and performance</p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <BookOpen className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Documentation</h3>
                  <p className="text-sm text-gray-600">Complete API reference and examples</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <AlertCircle className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-800">
                  Sign in to create API keys, view usage analytics, and access your personalized dashboard.
                </p>
              </div>

              <Button 
                onClick={() => setAuthModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Sign In to Continue
              </Button>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode="signin"
        />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Header title="ArbLens - API Management" />
        
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">API Management</h1>
            <p className="text-gray-600">Manage your API keys, monitor usage, and integrate with ArbLens</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs?.map((tab) => {
                const Icon = tab?.icon;
                return (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab?.id
                        ? "border-blue-500 text-blue-600" :"border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab?.label}
                    {tab?.id === "keys" && apiKeys?.length > 0 && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                        {apiKeys?.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "keys" && (
            <div className="space-y-6">
              {/* Create New Key Button */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Your API Keys</h2>
                  <p className="text-sm text-gray-600">Manage your API keys for accessing ArbLens data</p>
                </div>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Key</span>
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* API Keys List */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2]?.map((i) => (
                    <div key={i} className="bg-white border rounded-lg p-6">
                      <div className="animate-pulse">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                          </div>
                        </div>
                        <div className="h-12 bg-gray-200 rounded mb-4"></div>
                        <div className="flex space-x-4">
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : apiKeys?.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
                  <p className="text-gray-600 mb-6">
                    Create your first API key to start accessing ArbLens data programmatically.
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First API Key
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {apiKeys?.map((apiKey) => (
                    <ApiKeyCard
                      key={apiKey?.id}
                      apiKey={apiKey}
                      onDelete={handleDeleteApiKey}
                      onCopy={showNotification}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "analytics" && <UsageAnalytics />}
          {activeTab === "docs" && <ApiDocumentation />}
        </div>
      </div>
      {/* Modals */}
      <CreateApiKeyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateApiKey}
        userTier={user?.subscription_tier || 'free'}
      />
      <NotificationToast
        show={notification?.show}
        message={notification?.message}
        type={notification?.type}
        onClose={() => setNotification({ show: false, message: '', type: 'success' })}
      />
    </>
  );
}