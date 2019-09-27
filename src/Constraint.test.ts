import CheckerError from "./CheckerError";
import Constraint, { $array, $boolean, $const, $false, $never, $null, $number, $object, $string, $true, $undefined, $union } from "./Constraint";

describe('Constraint', () => {
  describe('Constraint.typeName', () => {
    const table: [string, Constraint][] = [
      ['boolean', $boolean],
      ['number', $number],
      ['string', $string],
      ['null', $null],
      ['undefined', $undefined],
      ['true', $true],
      ['1', $const(1)],
      ['"hoge"', $const('hoge')],
      ['string | number', $union($string, $number)],
      ['number[]', $array($number)],
      ['(number | boolean)[]', $array($union($number, $boolean))],
      ['[boolean, number, string, null, undefined]', $object([$boolean, $number, $string, $null, $undefined])],
      ['{}', $object({})],
      ['{ "a": number; "b": string | true; }', $object({
        a: $number,
        b: $union($string, $true)
      })]
    ];

    test.each(table)('%s', (typeName: string, constraint: Constraint) => {
      expect(constraint.typeName).toBe(typeName);
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

describe('$union()', () => {
  describe('型の消去', () => {
    describe('2回以上出現した型は消去される', () => {
      test('number | null | number => number | null', () => {
        expect($union($number, $null, $number).typeName).toBe('number | null');
      });

      test('(string | string)[] => string[]', () => {
        expect($array($union($string, $string)).typeName).toBe('string[]');
      });
    });

    describe(`'never' 型は消去される`, () => {
      test('never | string => string', () => {
        expect($union($never, $string).typeName).toBe('string');
      });
    });

    describe(`すべての型が消去された場合、 'never' 型`, () => {
      test('never | never => never', () => {
        expect($union($never, $never).typeName).toBe('never');
      });
    });
  });

  describe('ネストされた `$union()` は展開される', () => {
    test('number | (number | null) => number | null', () => {
      expect($union($number, $union($number, $null)).typeName).toBe('number | null')
    });

    test('(string | boolean) | (boolean | number) | (number | string) => string | number | boolean', () => {
      expect($union(
        $union($string, $boolean),
        $union($boolean, $number),
        $union($number, $string)).typeName).toBe('string | number | boolean');
    });
  });

  describe('型の出現順序', () => {
    test('undefined | null | {} | boolean | number | string => string | number | boolean | {} | null | undefined', () => {
      expect($union($undefined, $null, $object({}), $boolean, $number, $string).typeName)
        .toBe('string | number | boolean | {} | null | undefined');
    });

    test('null | "hoge" | boolean => boolean | "hoge" | null', () => {
      expect($union($null, $const("hoge"), $boolean).typeName).toBe('boolean | "hoge" | null');
    });

    test('null | "hoge" | true | number => number | true | "hoge" | null', () => {
      expect($union($null, $const("hoge"), $true, $number).typeName).toBe('number | true | "hoge" | null');
    });
  });
});