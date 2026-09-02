import { describe, it, expect } from 'vitest';
import { renderFormattedText } from '@/utils/text';
import React from 'react';

describe('renderFormattedText utility', () => {
  it('handles null or empty strings gracefully', () => {
    expect(renderFormattedText('')).toBeNull();
  });

  it('renders text with URLs, markdown bold, italic and code without throwing', () => {
    const text = `Check this issue: https://github.com/example/repo/issues/123\nPlease make sure **critical bug** is fixed with \`npm test\` before *release*!`;
    const element = renderFormattedText(text);
    expect(React.isValidElement(element)).toBe(true);
  });
});
