import { $boolean, $number, $string, $array, $union, $never, $const, $object } from "./Constraint"

describe('Constraint.typeName()', () => {
  test('boolean', () => {
    expect($boolean.typeName).toBe('boolean');
  });

  test('number', () => {
    expect($number.typeName).toBe('number');
  });

  test('string', () => {
    expect($string.typeName).toBe('string');
  });

  test('null', () => {
    expect($const(null).typeName).toBe('null');
  });

  test('undefined', () => {
    expect($const(undefined).typeName).toBe('undefined');
  });

  test('true', () => {
    expect($const(true).typeName).toBe('true');
  });

  test('1', () => {
    expect($const(1).typeName).toBe("1");
  });

  test(`"hoge"`, () => {
    expect($const('hoge').typeName).toBe(`"hoge"`);
  });

  test('number | string', () => {
    expect($union($number, $string).typeName).toBe('number | string');
  });

  test('number[]', () => {
    expect($array($number).typeName).toBe('number[]');
  });

  test('(number | string)[]', () => {
    expect($array($union($boolean, $number)).typeName).toBe('(boolean | number)[]');
  });

  test('number | null | number === number | null', () => {
    expect($union($number, $const(null), $number).typeName).toBe('number | null');
  });

  test('never | string === string', () => {
    expect($union($never, $string).typeName).toBe('string');
  });

  test('never | never === never', () => {
    expect($union($never, $never).typeName).toBe('never');
  });

  test('(string | string)[] === string[]', () => {
    expect($array($union($string, $string)).typeName).toBe('string[]');
  });

  test('[boolean, number, string, null, undefined]', () => {
    expect($object([$boolean, $number, $string, $const(null), $const(undefined)]).typeName).toBe('[boolean, number, string, null, undefined]');
  });

  test('{}', () => {
    expect($object({}).typeName).toBe('{}')
  });

  test('{ "a": number; "b": true | string; }', () => {
    expect($object({
      a: $number,
      b: $union($const(true), $string)
    }).typeName).toBe('{ "a": number; "b": true | string; }')
  });
});
