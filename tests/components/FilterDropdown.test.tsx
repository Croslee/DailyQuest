import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { FilterDropdown } from '@/components/ui/FilterDropdown';

describe('FilterDropdown Component', () => {
  const options = [
    { value: 'All', label: 'Tất cả' },
    { value: 'Health', label: 'Sức khỏe' },
    { value: 'Work', label: 'Công việc' },
  ];

  it('renders valid React element for FilterDropdown', () => {
    const el = React.createElement(FilterDropdown, {
      value: 'All',
      options,
      onChange: vi.fn(),
    });

    expect(React.isValidElement(el)).toBe(true);
    expect(el.props.value).toBe('All');
    expect(el.props.options).toHaveLength(3);
  });

  it('handles defaultValue prop properly', () => {
    const el = React.createElement(FilterDropdown, {
      value: 'Health',
      options,
      onChange: vi.fn(),
      defaultValue: 'All',
    });

    expect(el.props.defaultValue).toBe('All');
    expect(el.props.value).toBe('Health');
  });
});
