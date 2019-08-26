import getTypeName from "./getTypeName"
import { anyBoolean, anyNumber, anyString, arrayConstraint, union, neverConstraint } from "./Constraint"

describe('getTypeName()', () => {
  test('boolean', () => {
    expect(getTypeName(anyBoolean)).toBe('boolean');
  });

  test('number', () => {
    expect(getTypeName(anyNumber)).toBe('number');
  });

  test('string', () => {
    expect(getTypeName(anyString)).toBe('string');
  });

  test('null', () => {
    expect(getTypeName(null)).toBe('null');
  });

  test('undefined', () => {
    expect(getTypeName(undefined)).toBe('undefined');
  });

  test('true', () => {
    expect(getTypeName(true)).toBe('true');
  });

  test('1', () => {
    expect(getTypeName(1)).toBe("1");
  });

  test(`"hoge"`, () => {
    expect(getTypeName('hoge')).toBe(`"hoge"`);
  });

  test('number | string', () => {
    expect(getTypeName(union(anyNumber, anyString))).toBe('number | string');
  });

  test('number[]', () => {
    expect(getTypeName(arrayConstraint(anyNumber))).toBe('number[]');
  });

  test('(number | string)[]', () => {
    expect(getTypeName(arrayConstraint(union(anyBoolean, anyNumber)))).toBe('(boolean | number)[]');
  });

  test('number | null | number === number | null', () => {
    expect(getTypeName(union(anyNumber, null, anyNumber))).toBe('number | null');
  });

  test('never | string === string', () => {
    expect(getTypeName(union(neverConstraint, anyString))).toBe('string');
  });

  test('never | never === never', () => {
    expect(getTypeName(union(neverConstraint, neverConstraint))).toBe('never');
  });

  test('(string | string)[] === string[]', () => {
    expect(getTypeName(arrayConstraint(union(anyString, anyString)))).toBe('string[]');
  });

  test('[boolean, number, string, null, undefined]', () => {
    expect(getTypeName([anyBoolean, anyNumber, anyString, null, undefined])).toBe('[boolean, number, string, null, undefined]');
  });

  test('{}', () => {
    expect(getTypeName({})).toBe('{}')
  })

  test('{ "a": number; "b": true | string; }', () => {
    expect(getTypeName({ a: anyNumber, b: union(true, anyString) })).toBe('{ "a": number; "b": true | string; }')
  })
});
