import { describe, expect, it } from 'vitest';
import { filenameBulkAll, filenameBulkSelected, filenameSingle } from './filename';

describe('filename helpers', () => {
  it('singles are named after eventUnit.code', () => {
    expect(filenameSingle('FBLMTEAM11------------GPB-000100--')).toBe(
      'FBLMTEAM11------------GPB-000100--.json',
    );
  });

  it('bulk-all has a deterministic name', () => {
    expect(filenameBulkAll()).toBe('og2024-fbl-all.json');
  });

  it('bulk-selected encodes the count', () => {
    expect(filenameBulkSelected(0)).toBe('og2024-fbl-selected-0.json');
    expect(filenameBulkSelected(1)).toBe('og2024-fbl-selected-1.json');
    expect(filenameBulkSelected(58)).toBe('og2024-fbl-selected-58.json');
  });
});
