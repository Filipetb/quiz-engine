import { beforeAll, describe, expect, it, vi } from 'vitest';

import { evaluateExpression } from './compute';

beforeAll(() => {
  // Silencia console.warn disparado por inputs inválidos propositais.
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('evaluateExpression', () => {
  it('avalia literais numéricos', () => {
    expect(evaluateExpression('42', {})).toBe(42);
    expect(evaluateExpression('3.14', {})).toBe(3.14);
    expect(evaluateExpression('.5', {})).toBe(0.5);
  });

  it('respeita precedência de operadores', () => {
    expect(evaluateExpression('2 + 3 * 4', {})).toBe(14);
    expect(evaluateExpression('(2 + 3) * 4', {})).toBe(20);
    expect(evaluateExpression('10 / 2 - 1', {})).toBe(4);
  });

  it('trata operador unário', () => {
    expect(evaluateExpression('-5', {})).toBe(-5);
    expect(evaluateExpression('-(3 + 2)', {})).toBe(-5);
    expect(evaluateExpression('+7', {})).toBe(7);
  });

  it('resolve variáveis numéricas do escopo', () => {
    expect(evaluateExpression('a + b', { a: 10, b: 5 })).toBe(15);
  });

  it('calcula IMC (exemplo do PRD §14)', () => {
    const result = evaluateExpression(
      'weight_current / ((height_cm / 100) * (height_cm / 100))',
      { weight_current: 75, height_cm: 175 },
    );
    expect(result).not.toBeNull();
    expect(result).toBeCloseTo(24.489, 2);
  });

  it('retorna null se variável estiver ausente/null', () => {
    expect(evaluateExpression('a + 1', {})).toBeNull();
    expect(evaluateExpression('a + 1', { a: null })).toBeNull();
    expect(evaluateExpression('a + 1', { a: undefined })).toBeNull();
  });

  it('retorna null em divisão por zero', () => {
    expect(evaluateExpression('10 / 0', {})).toBeNull();
    expect(evaluateExpression('10 / (5 - 5)', {})).toBeNull();
  });

  it('aceita string numérica mas rejeita string não-numérica', () => {
    expect(evaluateExpression('a * 2', { a: '5' })).toBe(10);
    expect(evaluateExpression('a * 2', { a: 'foo' })).toBeNull();
  });

  it('rejeita expressões maliciosas e inválidas', () => {
    expect(evaluateExpression('alert(1)', {})).toBeNull();
    expect(evaluateExpression('a.b', { a: { b: 1 } })).toBeNull();
    expect(evaluateExpression('2 +', {})).toBeNull();
    expect(evaluateExpression('(2 + 3', {})).toBeNull();
  });
});
