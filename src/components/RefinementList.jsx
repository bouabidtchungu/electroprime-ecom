import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Mock data for filters
const AVAILABLE_FILTERS = {
  brand: ['Apple', 'Dell', 'HP', 'Lenovo', 'Samsung', 'Microsoft'],
  ram: ['8GB', '16GB', '32GB', '64GB'],
  storageType: ['SSD', 'NVMe', 'HDD'],
  price: { min: 50, max: 3000, step: 50 },
};

// Sub-Component for Checkbox Filters (Brand, RAM)
const CheckboxFilter = ({ title, options, activeFilters, onFilterChange, filterKey }) => {

  const handleCheckboxChange = (value) => {
    const currentValues = activeFilters[filterKey] || [];
    let newValues;

    if (currentValues.includes(value)) {
      newValues = currentValues.filter(v => v !== value);
    } else {
      newValues = [...currentValues, value];
    }

    onFilterChange({ 
      ...activeFilters, 
      [filterKey]: newValues.length > 0 ? newValues : undefined 
    });
  };

  return (
    <div className="mb-6 border-b border-ui-border/50 pb-4">
      <h3 className="font-semibold text-text-heavy mb-3 text-lg">{title}</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option} className="flex items-center text-sm text-text-light hover:text-tech-primary transition cursor-pointer">
            <input
              type="checkbox"
              checked={activeFilters[filterKey]?.includes(option)}
              onChange={() => handleCheckboxChange(option)}
              className="mr-2 rounded border-ui-border text-tech-primary focus:ring-tech-primary"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
};

// Sub-Component for Range Filters (Price)
const PriceFilter = ({ priceRange, activeFilters, onFilterChange }) => {
  const [range, setRange] = useState({ 
    min: activeFilters.priceMin || priceRange.min, 
    max: activeFilters.priceMax || priceRange.max 
  });

  const applyPriceFilter = () => {
    onFilterChange({
      ...activeFilters,
      priceMin: range.min,
      priceMax: range.max,
    });
  };

  return (
    <div className="mb-6 border-b border-ui-border/50 pb-4">
      <h3 className="font-semibold text-text-heavy mb-3 text-lg">Price Range</h3>

      <div className="flex justify-between text-sm font-medium text-text-heavy mb-3">
        <span>${range.min.toLocaleString()}</span>
        <span>${range.max.toLocaleString()}</span>
      </div>

      <input
        type="range"
        min={priceRange.min}
        max={priceRange.max}
        value={range.max} 
        step={priceRange.step}
        onChange={(e) => setRange({ ...range, max: Number(e.target.value) })}
        onMouseUp={applyPriceFilter} 
        className="w-full h-2 bg-ui-border rounded-lg appearance-none cursor-pointer focus:outline-none"
      />

      <button 
        onClick={applyPriceFilter}
        className="w-full mt-4 bg-tech-primary text-white py-2 rounded-lg text-sm hover:bg-[#005c93] transition"
      >
        Apply Price Filter
      </button>
    </div>
  );
};

const RefinementList = ({ activeFilters, onFilterChange }) => {

  const clearAllFilters = () => {
    onFilterChange({});
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-xl shadow-md"
    >

      {/* 1. Clear All Button */}
      {Object.keys(activeFilters).length > 0 && (
        <button 
          onClick={clearAllFilters}
          className="w-full mb-6 text-sm text-center text-ui-error border border-ui-error py-2 rounded-lg hover:bg-ui-error hover:text-white transition duration-200"
        >
          Clear All Active Filters
        </button>
      )}

      {/* 2. Checkbox Filters */}
      <CheckboxFilter 
        title="Brand" 
        options={AVAILABLE_FILTERS.brand} 
        activeFilters={activeFilters} 
        onFilterChange={onFilterChange} 
        filterKey="brand"
      />

      <CheckboxFilter 
        title="RAM Size" 
        options={AVAILABLE_FILTERS.ram} 
        activeFilters={activeFilters} 
        onFilterChange={onFilterChange} 
        filterKey="ram"
      />

      <CheckboxFilter 
        title="Storage Type" 
        options={AVAILABLE_FILTERS.storageType} 
        activeFilters={activeFilters} 
        onFilterChange={onFilterChange} 
        filterKey="storageType"
      />

      {/* 3. Range Filter */}
      <PriceFilter
        priceRange={AVAILABLE_FILTERS.price}
        activeFilters={activeFilters}
        onFilterChange={onFilterChange}
      />

    </motion.div>
  );
};

export default RefinementList;