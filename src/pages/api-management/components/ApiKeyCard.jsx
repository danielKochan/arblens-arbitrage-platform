import React, { useState } from "react";
import { Copy, Eye, EyeOff, Trash2, Key, Calendar, Activity } from "lucide-react";
import Button from '../../../components/ui/Button';
import { apiKeyService } from "../../../utils/supabaseServices";
import { useAuth } from "../../../contexts/AuthContext";

export function ApiKeyCard({ 
  apiKey, 
  onDelete,
  onCopy 
}) {
  const [showKey, setShowKey] = useState(false);
  const [copying, setCopying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const handleCopy = async (textToCopy) => {
    try {
      setCopying(true);
      await navigator.clipboard?.writeText(textToCopy);
      onCopy?.('API key copied to clipboard');
    } catch (error) {
      onCopy?.('Failed to copy API key');
    } finally {
      setCopying(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await apiKeyService?.deleteApiKey(apiKey?.id, user?.id);
      onDelete?.(apiKey?.id);
    } catch (error) {
      alert(error?.message || 'Failed to delete API key');
    } finally {
      setDeleting(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'partner': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString)?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mock full key for display (in production, this would be handled securely)
  const fullKey = apiKey?.key_value || `${apiKey?.key_prefix}${'*'?.repeat(32)}${apiKey?.key_prefix?.slice(-4) || ''}`;
  const displayKey = showKey ? fullKey : `${apiKey?.key_prefix}${'*'?.repeat(32)}****`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Key className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {apiKey?.key_name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTierColor(apiKey?.tier)}`}>
                {apiKey?.tier?.charAt(0)?.toUpperCase() + apiKey?.tier?.slice(1)}
              </span>
              <span className="text-xs text-gray-500">
                {apiKey?.rate_limit_per_minute} req/min
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowKey(!showKey)}
            className="flex items-center space-x-1"
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showKey ? 'Hide' : 'Show'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* API Key Display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">API Key</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(fullKey)}
            disabled={copying}
            className="text-blue-600 hover:text-blue-700"
          >
            <Copy className="h-4 w-4 mr-1" />
            {copying ? 'Copying...' : 'Copy'}
          </Button>
        </div>
        <div className="font-mono text-sm bg-white border rounded px-3 py-2 break-all">
          {displayKey}
        </div>
      </div>
      {/* Usage Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">Created</div>
            <div className="text-sm font-medium text-gray-900">
              {formatDate(apiKey?.created_at)}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">Last Used</div>
            <div className="text-sm font-medium text-gray-900">
              {formatDate(apiKey?.last_used_at)}
            </div>
          </div>
        </div>
      </div>
      {/* Status */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${apiKey?.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {apiKey?.is_active ? 'Active' : 'Disabled'}
            </span>
          </div>

          {apiKey?.expires_at && (
            <div className="text-sm text-gray-500">
              Expires: {formatDate(apiKey?.expires_at)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}