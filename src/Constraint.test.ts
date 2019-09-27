import Constraint, { $array, $boolean, $const, $false, $never, $null, $number, $object, $string, $true, $undefined, $union } from "./Constraint";
import CheckerError from "./CheckerError";

describe('Constraint', () => {
  describe('Constraint.typeName', () => {
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

    test('(boolean | number)[]', () => {
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

  describe('Constraint.getChildByProperty()', () => {
    describe(`プリミティブ型の子プロパティは 'never' 型である`, () => {
      const table: [string, Constraint][] = [
        $string, $const('fuga'), $number, $const(2), $boolean, $true, $false, $null, $undefined,
        $union($number, $boolean),
        $union($null, $undefined)
      ].map(constraint => [constraint.typeName, constraint]);

      test.each(table)(
        `型 '%s' の子プロパティは 'never' 型である`,
        (_, constraint) => {
          expect(constraint.getChildByProperty('a')).toBe($never);
        });
    });

    describe('オブジェクト型に定義された子プロパティの型', () => {
      const table0: [Constraint, Constraint][] = [
        [$object({ a: $string }), $string],
        [$object({ a: $union($number, $boolean) }), $union($number, $boolean)],
        [$object({ a: $object({ b: $string }) }), $object({ b: $string })],
        [$union($object({ a: $number }), $object({ a: $boolean })), $union($number, $boolean)],
        [$union($object({ a: $null }), $object({ a: $undefined }), $string), $union($null, $undefined)]
      ];
      const table: [string, string, Constraint][] = table0.map(([constraint, childConstraint]: [Constraint, Constraint]) => [constraint.typeName, childConstraint.typeName, constraint]);

      test.each(table)(
        `型 '%s' のプロパティ 'a' は '%s' 型である`,
        (_, childTypeName, constraint) => {
          expect(constraint.getChildByProperty('a')).not.toBeNull();
          expect(constraint.getChildByProperty('a')).not.toBeUndefined();
          expect(constraint.getChildByProperty('a')!.typeName).toBe(childTypeName);
        }
      );
    });

    describe(`オブジェクト型に定義されていない子プロパティに関する制約は存在しない`, () => {
      const table: [string, Constraint][] = [
        $object({}),
        $union($object({ a: $number }), $object({ b: $boolean })),
        $union($object({ a: $null }), $object({ b: $undefined }), $string)
      ].map(constraint => [constraint.typeName, constraint]);

      test.each(table)(
        `型 '%s' のプロパティ 'a' に関する制約は存在しない`,
        (_, constraint) => {
          expect(constraint.getChildByProperty('a')).toBeNull();
        }
      );
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

    describe(`'value' が期待されている型でない場合、 'CheckerError' を投げる`, () => {
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
        `型 '%s' が期待されているとき、 'value' が '%p' であれば 'CheckerError' を投げる`,
        (_, value, constraint) => {
          expect(() => { constraint.check1(value) }).toThrow(CheckerError);
        });
    });
  });
});
