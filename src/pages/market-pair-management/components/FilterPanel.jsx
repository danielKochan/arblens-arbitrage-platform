import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const FilterPanel = ({ 
  filters, 
  onFiltersChange, 
  searchQuery, 
  onSearchChange, 
  onResetFilters 
}) => {
  const venueOptions = [
    { value: 'Polymarket', label: 'Polymarket' },
    { value: 'Kalshi', label: 'Kalshi' },
    { value: 'Betfair', label: 'Betfair' },
    { value: 'Manifold', label: 'Manifold' }
  ];

  const categoryOptions = [
    { value: 'Politics', label: 'Politics' },
    { value: 'Sports', label: 'Sports' },
    { value: 'Economics', label: 'Economics' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Weather', label: 'Weather' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'overridden', label: 'Overridden' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const confidenceRanges = [
    { value: '', label: 'Any Confidence' },
    { value: 90, label: '90%+ (High)' },
    { value: 70, label: '70%+ (Medium)' },
    { value: 50, label: '50%+ (Low)' }
  ];

  const hasActiveFilters = 
    searchQuery || 
    filters?.minConfidence || 
    filters?.venues?.length > 0 || 
    filters?.categories?.length > 0 || 
    filters?.status !== 'all';

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-medium text-text-primary flex items-center space-x-2">
          <Icon name="Filter" size={18} />
          <span>Filters</span>
        </h3>
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onResetFilters}
            iconName="X"
            iconPosition="left"
          >
            Clear All
          </Button>
        )}
      </div>
      {/* Search */}
      <div>
        <Input
          type="search"
          placeholder="Search market titles..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e?.target?.value)}
          className="w-full"
        />
      </div>
      {/* Confidence Filter */}
      <div>
        <Select
          label="Minimum Confidence"
          options={confidenceRanges}
          value={filters?.minConfidence}
          onChange={(value) => onFiltersChange({ ...filters, minConfidence: value })}
          placeholder="Select confidence threshold"
        />
      </div>
      {/* Venue Filter */}
      <div>
        <Select
          label="Venues"
          options={venueOptions}
          value={filters?.venues}
          onChange={(value) => onFiltersChange({ ...filters, venues: value })}
          multiple
          searchable
          placeholder="Select venues"
        />
      </div>
      {/* Category Filter */}
      <div>
        <Select
          label="Categories"
          options={categoryOptions}
          value={filters?.categories}
          onChange={(value) => onFiltersChange({ ...filters, categories: value })}
          multiple
          searchable
          placeholder="Select categories"
        />
      </div>
      {/* Status Filter */}
      <div>
        <Select
          label="Status"
          options={statusOptions}
          value={filters?.status}
          onChange={(value) => onFiltersChange({ ...filters, status: value })}
          placeholder="Select status"
        />
      </div>
      {/* Quick Stats */}
      <div className="border-t border-border pt-4 space-y-2">
        <h4 className="text-sm font-medium text-text-primary">Quick Stats</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-muted/30 rounded p-2">
            <div className="text-text-secondary">Total Pairs</div>
            <div className="font-semibold text-text-primary">1,247</div>
          </div>
          <div className="bg-muted/30 rounded p-2">
            <div className="text-text-secondary">High Confidence</div>
            <div className="font-semibold text-success">342</div>
          </div>
          <div className="bg-muted/30 rounded p-2">
            <div className="text-text-secondary">Pending Review</div>
            <div className="font-semibold text-warning">89</div>
          </div>
          <div className="bg-muted/30 rounded p-2">
            <div className="text-text-secondary">Overridden</div>
            <div className="font-semibold text-accent">156</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;