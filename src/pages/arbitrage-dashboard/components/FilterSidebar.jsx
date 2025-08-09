import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const FilterSidebar = ({ filters, onFiltersChange, isCollapsed, onToggleCollapse }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const venues = [
    { id: 'polymarket', name: 'Polymarket', status: 'active' },
    { id: 'kalshi', name: 'Kalshi', status: 'active' },
    { id: 'betfair', name: 'Betfair', status: 'active' },
    { id: 'manifold', name: 'Manifold', status: 'maintenance' }
  ];

  const categories = [
    { id: 'politics', name: 'Politics', count: 234 },
    { id: 'sports', name: 'Sports', count: 156 },
    { id: 'crypto', name: 'Crypto', count: 89 },
    { id: 'economics', name: 'Economics', count: 67 },
    { id: 'entertainment', name: 'Entertainment', count: 45 },
    { id: 'weather', name: 'Weather', count: 23 }
  ];

  const handleFilterChange = (key, value) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleVenueToggle = (venueId) => {
    const updatedVenues = localFilters?.venues?.includes(venueId)
      ? localFilters?.venues?.filter(id => id !== venueId)
      : [...localFilters?.venues, venueId];
    handleFilterChange('venues', updatedVenues);
  };

  const handleCategoryToggle = (categoryId) => {
    const updatedCategories = localFilters?.categories?.includes(categoryId)
      ? localFilters?.categories?.filter(id => id !== categoryId)
      : [...localFilters?.categories, categoryId];
    handleFilterChange('categories', updatedCategories);
  };

  const clearAllFilters = () => {
    const resetFilters = {
      venues: [],
      categories: [],
      minSpread: 0,
      maxSpread: 100,
      minLiquidity: 0,
      minConfidence: 0,
      searchTerm: ''
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  if (isCollapsed) {
    return (
      <div className="fixed top-32 left-4 z-50 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleCollapse}
          className="w-10 h-10 bg-background shadow-lg"
        >
          <Icon name="Filter" size={18} />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-background border-r border-border h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold text-primary">Filters</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-text-secondary hover:text-text-primary"
            >
              Clear All
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="lg:hidden w-8 h-8"
            >
              <Icon name="X" size={16} />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div>
          <Input
            type="search"
            placeholder="Search markets..."
            value={localFilters?.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e?.target?.value)}
            className="w-full"
          />
        </div>

        {/* Venues */}
        <div>
          <h3 className="text-sm font-medium text-primary mb-3">Venues</h3>
          <div className="space-y-2">
            {venues?.map((venue) => (
              <div key={venue?.id} className="flex items-center justify-between">
                <Checkbox
                  label={venue?.name}
                  checked={localFilters?.venues?.includes(venue?.id)}
                  onChange={() => handleVenueToggle(venue?.id)}
                  disabled={venue?.status === 'maintenance'}
                />
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    venue?.status === 'active' ? 'bg-success' : 'bg-warning'
                  }`} />
                  {venue?.status === 'maintenance' && (
                    <span className="text-xs text-warning">Maintenance</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spread Range */}
        <div>
          <h3 className="text-sm font-medium text-primary mb-3">Spread Range (%)</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={localFilters?.minSpread}
                onChange={(e) => handleFilterChange('minSpread', parseFloat(e?.target?.value) || 0)}
                className="flex-1"
              />
              <span className="text-text-secondary">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={localFilters?.maxSpread}
                onChange={(e) => handleFilterChange('maxSpread', parseFloat(e?.target?.value) || 100)}
                className="flex-1"
              />
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={localFilters?.minSpread}
                onChange={(e) => handleFilterChange('minSpread', parseFloat(e?.target?.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={localFilters?.maxSpread}
                onChange={(e) => handleFilterChange('maxSpread', parseFloat(e?.target?.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer absolute top-0"
              />
            </div>
          </div>
        </div>

        {/* Liquidity Threshold */}
        <div>
          <h3 className="text-sm font-medium text-primary mb-3">Min Liquidity ($)</h3>
          <Input
            type="number"
            placeholder="0"
            value={localFilters?.minLiquidity}
            onChange={(e) => handleFilterChange('minLiquidity', parseFloat(e?.target?.value) || 0)}
            className="w-full"
          />
          <div className="mt-2">
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={localFilters?.minLiquidity}
              onChange={(e) => handleFilterChange('minLiquidity', parseFloat(e?.target?.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-sm font-medium text-primary mb-3">Categories</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categories?.map((category) => (
              <div key={category?.id} className="flex items-center justify-between">
                <Checkbox
                  label={category?.name}
                  checked={localFilters?.categories?.includes(category?.id)}
                  onChange={() => handleCategoryToggle(category?.id)}
                />
                <span className="text-xs text-text-secondary bg-muted px-2 py-1 rounded">
                  {category?.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence Score */}
        <div>
          <h3 className="text-sm font-medium text-primary mb-3">Min Confidence Score</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">{localFilters?.minConfidence}%</span>
              <span className="text-xs text-text-secondary">
                {localFilters?.minConfidence >= 80 ? 'High' : 
                 localFilters?.minConfidence >= 60 ? 'Medium' : 'Low'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={localFilters?.minConfidence}
              onChange={(e) => handleFilterChange('minConfidence', parseFloat(e?.target?.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;