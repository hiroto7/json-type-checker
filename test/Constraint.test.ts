import CheckerError from "../src/CheckerError";
import Constraint, { $array, $boolean, $const, $false, $never, $null, $number, $object, $string, $true, $undefined, $union, $optional } from "../src/Constraint";
import * as helpers from './helpers';

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
      ['never', $never],
      ['string | number', $union($string, $number)],
      ['number[]', $array($number)],
      ['(number | boolean)[]', $array($union($number, $boolean))],
      ['[boolean, number, string, null, undefined]', $object(
        [$boolean, $number, $string, $null, $undefined]
      )],
      ['[boolean, number, string?, null?]', $object(
        [$boolean, $number, $optional($string), $optional($null)]
      )],
      ['{}', $object({})],
      ['{ "a": number; "b"?: number | undefined; "c": (string | true)[]; "d"?: (string | true)[] | undefined; }', $object({
        a: $number,
        b: $optional($number),
        c: $array($union($string, $true)),
        d: $optional($array($union($string, $true))),
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

  {
    const table00: [string, unknown, Constraint][] = ([
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
      [$object({}), {}],
      [$array($number), [0, 1]],
      [$union($number, $boolean), 1],
      [$union($number, $boolean), true],
      [$union($null, $undefined), null],
      [$union($null, $undefined), undefined],
      [$union($object({}), $array($number)), {}],
      [$union($object({}), $array($number)), [0, 1]],
    ] as const).map(([constraint, value]): [string, unknown, Constraint] => [constraint.typeName, value, constraint]);

    const table01: [string, unknown, Constraint][] = ([
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
      [$object({}), 'hoge'],
      [$object({}), 1],
      [$object({}), false],
      [$object({}), null],
      [$object({}), undefined],
      [$array($number), 'hoge'],
      [$array($number), 1],
      [$array($number), false],
      [$array($number), null],
      [$array($number), undefined],
      [$array($number), {}],
      [$never, 'hoge'],
      [$never, 1],
      [$never, false],
      [$never, null],
      [$never, undefined],
      [$never, {}],
      [$union($number, $boolean), 'hoge'],
      [$union($null, $undefined), 'hoge'],
      [$union($object({}), $array($number)), 'hoge'],
    ] as const).map(([constraint, value]): [string, unknown, Constraint] => [constraint.typeName, value, constraint]);

    describe('Constraint.checkOnlySurface()', () => {
      describe(`'value' が 期待されている型である場合、正常終了`, () => {
        test.each(table00)(
          `型 '%s' が期待されているとき、 'value' が '%p' であれば正常終了`,
          (_, value, constraint) => {
            constraint.checkOnlySurface(value);
          });
      });

      describe(`'value' が期待されている型でない場合、 'CheckerError' を投げる`, () => {
        test.each(table01)(
          `型 '%s' が期待されているとき、 'value' が '%p' であれば 'CheckerError' を投げる`,
          (_, value, constraint) => {
            expect(() => { constraint.checkOnlySurface(value) }).toThrow(CheckerError);
          });
      });
    });

    {
      const table10: [string, unknown, Constraint][] = helpers.table0.map(constraint => [constraint.typeName, { a: 1 }, constraint]);
      const row20: [string, unknown, Constraint] = [helpers.constraint1.typeName, { a: { b: 1 } }, helpers.constraint1];
      const table30: [string, unknown, Constraint][] = helpers.table2.map(constraint => [constraint.typeName, [0, 1, 4, 9], constraint]);

      const table11: [string, unknown, Constraint][] = helpers.table0.map(constraint => [constraint.typeName, { a: 'hoge' }, constraint]);
      const row21: [string, unknown, Constraint] = [helpers.constraint1.typeName, { a: { b: 'hoge' } }, helpers.constraint1];
      const table31: [string, unknown, Constraint][] = helpers.table2.map(constraint => [constraint.typeName, ['h', 'o', 'g', 'e'], constraint]);

      describe('Constraint.check()', () => {
        describe(`'value' が 期待されている型である場合、正常終了`, () => {
          test.each([...table00, ...table10, row20, ...table30])(
            `型 '%s' が期待されているとき、 'value' が '%p' であれば正常終了`,
            (_, value, constraint) => {
              constraint.check(value);
            });
        });

        describe(`'value' が期待されている型でない場合、 'CheckerError' を投げる`, () => {
          test.each([...table01, ...table11, row21, ...table31])(
            `型 '%s' が期待されているとき、 'value' が '%p' であれば 'CheckerError' を投げる`,
            (_, value, constraint) => {
              expect(() => { constraint.check(value) }).toThrow(CheckerError);
            });
        });
      });

      describe('Constraint.isCompatible()', () => {
        describe(`'value' が期待されている型である場合、 'true' を返す`, () => {
          test.each([...table00, ...table10, row20, ...table30])(
            `型 '%s' が期待されているとき、 'value' が '%p' であれば 'true' を返す`,
            (_, value, constraint) => {
              expect(constraint.isCompatible(value)).toBe(true);
            });
        });

        describe(`'value' が期待されている型でない場合、 'false' を返す`, () => {
          test.each([...table01, ...table11, row21, ...table31])(
            `型 '%s' が期待されているとき、 'value' が '%p' であれば 'false' を返す`,
            (_, value, constraint) => {
              expect(constraint.isCompatible(value)).toBe(false);
            });
        });
      });
    }
  }
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