import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MarketPairTable = ({ 
  marketPairs, 
  selectedPair, 
  onSelectPair, 
  filters, 
  searchQuery,
  onBulkAction 
}) => {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'confidence', direction: 'desc' });

  const filteredAndSortedPairs = useMemo(() => {
    let filtered = marketPairs?.filter(pair => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery?.toLowerCase();
        if (!pair?.market1?.title?.toLowerCase()?.includes(query) && 
            !pair?.market2?.title?.toLowerCase()?.includes(query)) {
          return false;
        }
      }

      // Confidence filter
      if (filters?.minConfidence && pair?.confidence < filters?.minConfidence) {
        return false;
      }

      // Venue filter
      if (filters?.venues?.length > 0) {
        const pairVenues = [pair?.market1?.venue, pair?.market2?.venue];
        if (!filters?.venues?.some(venue => pairVenues?.includes(venue))) {
          return false;
        }
      }

      // Category filter
      if (filters?.categories?.length > 0) {
        if (!filters?.categories?.includes(pair?.category)) {
          return false;
        }
      }

      // Status filter
      if (filters?.status !== 'all' && pair?.status !== filters?.status) {
        return false;
      }

      return true;
    });

    // Sort
    if (sortConfig?.key) {
      filtered?.sort((a, b) => {
        let aValue = a?.[sortConfig?.key];
        let bValue = b?.[sortConfig?.key];

        if (sortConfig?.key === 'confidence') {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        }

        if (aValue < bValue) return sortConfig?.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig?.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [marketPairs, searchQuery, filters, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleRowSelect = (pairId) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet?.has(pairId)) {
        newSet?.delete(pairId);
      } else {
        newSet?.add(pairId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows?.size === filteredAndSortedPairs?.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredAndSortedPairs.map(pair => pair.id)));
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-success';
    if (confidence >= 70) return 'text-warning';
    return 'text-error';
  };

  const getStatusBadge = (status) => {
    const styles = {
      'active': 'bg-success/10 text-success border-success/20',
      'pending': 'bg-warning/10 text-warning border-warning/20',
      'overridden': 'bg-accent/10 text-accent border-accent/20',
      'rejected': 'bg-error/10 text-error border-error/20'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded border ${styles?.[status] || styles?.pending}`}>
        {status?.charAt(0)?.toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getVenueBadge = (venue) => {
    const venueColors = {
      'Polymarket': 'bg-blue-100 text-blue-800 border-blue-200',
      'Kalshi': 'bg-green-100 text-green-800 border-green-200',
      'Betfair': 'bg-purple-100 text-purple-800 border-purple-200',
      'Manifold': 'bg-orange-100 text-orange-800 border-orange-200'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded border ${venueColors?.[venue] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {venue}
      </span>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Bulk Actions Toolbar */}
      {selectedRows?.size > 0 && (
        <div className="bg-muted border-b border-border px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-text-secondary">
            {selectedRows?.size} pair{selectedRows?.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction('approve', Array.from(selectedRows))}
              iconName="Check"
              iconPosition="left"
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction('reject', Array.from(selectedRows))}
              iconName="X"
              iconPosition="left"
            >
              Reject
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedRows(new Set())}
              iconName="X"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="w-12 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows?.size === filteredAndSortedPairs?.length && filteredAndSortedPairs?.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-border"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                Market Pair
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-text-primary cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('confidence')}
              >
                <div className="flex items-center space-x-1">
                  <span>Confidence</span>
                  <Icon 
                    name={sortConfig?.key === 'confidence' && sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
                    size={14} 
                  />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                Venues
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredAndSortedPairs?.map((pair) => (
              <tr
                key={pair?.id}
                className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                  selectedPair?.id === pair?.id ? 'bg-accent/10' : ''
                }`}
                onClick={() => onSelectPair(pair)}
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedRows?.has(pair?.id)}
                    onChange={(e) => {
                      e?.stopPropagation();
                      handleRowSelect(pair?.id);
                    }}
                    className="rounded border-border"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-text-primary line-clamp-1">
                      {pair?.market1?.title}
                    </div>
                    <div className="text-sm text-text-secondary line-clamp-1">
                      {pair?.market2?.title}
                    </div>
                    <div className="text-xs text-text-secondary">
                      Category: {pair?.category}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getConfidenceColor(pair?.confidence)}`}>
                      {pair?.confidence}%
                    </span>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          pair?.confidence >= 90 ? 'bg-success' :
                          pair?.confidence >= 70 ? 'bg-warning' : 'bg-error'
                        }`}
                        style={{ width: `${pair?.confidence}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col space-y-1">
                    {getVenueBadge(pair?.market1?.venue)}
                    {getVenueBadge(pair?.market2?.venue)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  {getStatusBadge(pair?.status)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      iconName="Link"
                      onClick={(e) => {
                        e?.stopPropagation();
                        onBulkAction('link', [pair?.id]);
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      iconName="Unlink"
                      onClick={(e) => {
                        e?.stopPropagation();
                        onBulkAction('unlink', [pair?.id]);
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      iconName="Settings"
                      onClick={(e) => {
                        e?.stopPropagation();
                        onSelectPair(pair);
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredAndSortedPairs?.length === 0 && (
        <div className="text-center py-12">
          <Icon name="Search" size={48} color="var(--color-text-secondary)" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No market pairs found</h3>
          <p className="text-text-secondary">
            {searchQuery || Object.values(filters)?.some(f => f && f?.length > 0) 
              ? 'Try adjusting your search or filters' :'No market pairs available at the moment'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketPairTable;