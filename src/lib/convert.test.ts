import { describe, it, expect } from 'vitest';
import { toTotal, parseCount, istParts, cleanNaam, normKey } from './convert';
describe('counting', () => {
  it('converts Mala to individual Naam', () => {
    expect(toTotal('mala', 1)).toBe(108); expect(toTotal('mala', 5)).toBe(540);
    expect(toTotal('mala', 10)).toBe(1080); expect(toTotal('naam', 250)).toBe(250);
  });
  it('accepts only positive whole numbers', () => {
    expect(parseCount('7')).toBe(7);
    for (const bad of ['0', '', '-1', '1.5', '1e3', 'abc', '12345678']) expect(parseCount(bad)).toBeNull();
  });
  it('normalises Naam names', () => { expect(cleanNaam('  Om   Namah  ')).toBe('Om Namah'); expect(normKey(' OM namah ')).toBe('om namah'); });
  it('formats IST date and time', () => {
    const p = istParts(new Date('2026-11-01T20:00:00Z'));
    expect(p.date).toBe('02-11-2026'); expect(p.time).toBe('01:30 AM'); expect(p.dayKey).toBe('2026-11-02');
  });
});
