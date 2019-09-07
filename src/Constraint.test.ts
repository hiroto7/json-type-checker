import Constraint, { $array, $boolean, $const, $false, $never, $null, $number, $object, $string, $true, $undefined, $union } from "./Constraint";
import JSONTypeError from "./JSONTypeError";

describe('Constraint', () => {
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

  describe('Constraint.check1()', () => {
    describe(`'value' が 期待されている型である場合、正常終了`, () => {
      const table: [string, unknown, Constraint][] = ([
        [$string, ''],
        [$string, 'hoge'],
        [$const('fuga'), 'fuga'],
        [$number, 0],
        [$number, 1],
        [$const(2), 2],
        [$boolean, true],
        [$boolean, false],
        [$true, true],
        [$false, false],
        [$null, null],
        [$undefined, undefined],
        [$union($number, $boolean), 1],
        [$union($number, $boolean), true],
        [$union($null, $undefined), null],
        [$union($null, $undefined), undefined]
      ] as const).map(([constraint, value]): [string, unknown, Constraint] => [constraint.typeName, value, constraint]);

      test.each(table)(
        `型 '%s' が期待されているとき、 'value' が '%p' であれば正常終了`,
        (_, value, constraint) => {
          constraint.check1(value)
        });
    });

    describe(`'value' が期待されている型でない場合、 'JSONTypeError' を投げる`, () => {
      const table: [string, unknown, Constraint][] = ([
        [$string, 1],
        [$string, false],
        [$string, null],
        [$string, undefined],
        [$string, {}],
        [$const('fuga'), 'hoge'],
        [$const('fuga'), 1],
        [$const('fuga'), false],
        [$const('fuga'), null],
        [$const('fuga'), undefined],
        [$const('fuga'), {}],
        [$number, 'hoge'],
        [$number, false],
        [$number, null],
        [$number, undefined],
        [$number, {}],
        [$const(2), 'hoge'],
        [$const(2), 1],
        [$const(2), false],
        [$const(2), null],
        [$const(2), undefined],
        [$const(2), {}],
        [$boolean, 'hoge'],
        [$boolean, 1],
        [$boolean, null],
        [$boolean, undefined],
        [$boolean, {}],
        [$true, 'hoge'],
        [$true, 1],
        [$true, false],
        [$true, null],
        [$true, undefined],
        [$true, {}],
        [$null, 'hoge'],
        [$null, 1],
        [$null, false],
        [$null, undefined],
        [$null, {}],
        [$undefined, 'hoge'],
        [$undefined, 1],
        [$undefined, false],
        [$undefined, null],
        [$undefined, {}],
        [$never, 'hoge'],
        [$never, 1],
        [$never, false],
        [$never, null],
        [$never, undefined],
        [$never, {}],
        [$union($number, $boolean), 'hoge'],
        [$union($null, $undefined), 'hoge']
      ] as const).map(([constraint, value]): [string, unknown, Constraint] => [constraint.typeName, value, constraint]);

      test.each(table)(
        `型 '%s' が期待されているとき、 'value' が '%p' であれば 'JSONTypeError' を投げる`,
        (_, value, constraint) => {
          expect(() => { constraint.check1(value) }).toThrow(JSONTypeError);
        });
    });
  });
});
