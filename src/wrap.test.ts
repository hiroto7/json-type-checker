import CheckerError from "./CheckerError";
import Constraint, { $array, $boolean, $number, $object, $string, $union } from "./Constraint";
import { wrap } from "./wrap";

describe('wrap()', () => {
  describe('wrap(...).a', () => {
    {
      const table: [string, Constraint][] = ([
        $object({ a: $number }),
        $object({ a: $union($boolean, $number) }),
        $union($object({ a: $boolean }), $object({ a: $number })),
      ] as const).map((constraint) => [constraint.typeName, constraint]);

      describe(
        `'value' が期待されている型である場合、 'wrap(...).a' を参照したときにその値を返す`,
        () => {
          test.each(table)(
            `型 '%s' が期待されているとき、 'value' が '{ "a": 1 }' であれば 'wrap(...).a' を参照したときに '1' を返す`,
            (_, constraint) => {
              const wrapped = wrap({ a: 1 }, constraint) as { a: unknown };
              expect(wrapped.a).toBe(1);
            }
          );
        });

      describe(
        `'value' および 'value.a' が期待されている型でない場合、 'wrap(...).a' を参照したときに 'CheckerError' を投げる`,
        () => {
          test.each(table)(
            `型 '%s' が期待されているとき、 'value' が '{ "a": "hoge" }' であれば 'wrap(...).a' を参照したときに 'CheckerError' を投げる`,
            (_, constraint) => {
              const wrapped = wrap({ a: 'hoge' }, constraint) as { a: unknown };
              expect(() => { wrapped.a }).toThrow(CheckerError);
            }
          );
        });
    }

    describe(
      `'value.a' に対応する制約が存在しない場合、 'wrap(...).a' を参照したときにその値を必ず返す`,
      () => {
        const constraint = $object({ b: $number });
        const table: [{ a: unknown, b: number }, unknown][] = [
          [{ a: 2, b: 1 }, 2],
          [{ a: {}, b: 1 }, {}],
        ]
        test.each(table)(
          `'value.a' に対応する制約が存在しないとき、 'value' が '%p' であれば 'wrap(...).a' を参照したときに '%p' を必ず返す`,
          (value0, value1) => {
            const wrapped = wrap(value0, constraint) as { a: unknown, b: number };
            expect(wrapped.a).toEqual(value1);
          }
        )
      }
    );
  });

  describe('wrap(...).a.b', () => {
    const constraint = $object({ a: $object({ b: $number }) });

    describe(
      `'value' が期待されている型である場合、 'wrap(...).a.b' を参照したときにその値を返す`,
      () => {
        test(
          `型 '${constraint.typeName}' が期待されているとき、 'value' が '{ "a": { "b": 1 } }' であれば 'wrap(...).a.b' を参照したときに '1' を返す`,
          () => {
            const wrapped = wrap({ a: { b: 1 } }, constraint);
            expect(wrapped.a.b).toBe(1);
          });
      });

    describe(
      `'value' および 'value.a.b が期待されている型でない場合、 'wrap(...).a.b' を参照したときに'CheckerError' を投げる`,
      () => {
        test(
          `型 '${constraint.typeName}' が期待されているとき、 'value' が '{ "a": { "b": "hoge" } }' であれば 'wrap(...).a.b' を参照したときに 'CheckerError' を投げる`,
          () => {
            const wrapped = wrap({ a: { b: 'hoge' } } as unknown as { a: { b: number } }, constraint);
            expect(() => { wrapped.a.b }).toThrow(CheckerError);
          });
      });
  });

  describe('wrap(..., $array(...))[...]', () => {
    {
      const table: [string, Constraint][] = ([
        $array($number),
        $array($union($boolean, $number)),
        $union($array($boolean), $array($number)),
      ] as const).map((constraint) => [constraint.typeName, constraint]);

      describe(
        `'value' が期待されている型である場合、 'wrap(...)[1]' を参照したときにその値を返す`,
        () => {
          test.each(table)(
            `型 '%s' が期待されているとき、 'value' が '[0, 1, 4, 9]' であれば 'wrap(...)[1]' を参照したときに '1' を返す`,
            (_, constraint) => {
              const wrapped = wrap([0, 1, 4, 9], constraint) as unknown[];
              expect(wrapped[1]).toBe(1);
            }
          );
        });

      describe(
        `'value' および 'value[1]' が期待されている型でない場合、 'wrap(...)[1]' を参照したときに 'CheckerError' を投げる`,
        () => {
          test.each(table)(
            `型 '%s' が期待されているとき、 'value' が '["h", "o", "g", "e"]' であれば 'wrap(...)[1]' を参照したときに 'CheckerError' を投げる`,
            (_, constraint) => {
              const wrapped = wrap(["h", "o", "g", "e"], constraint) as unknown[];
              expect(() => { wrapped[1] }).toThrow(CheckerError);
            }
          );
        });
    }

    describe(
      `制約が配列型である場合、自然数以外のインデックスで 'wrap(...)' のプロパティにアクセスしたときにその値を必ず返す`,
      () => {
        const constraint = $array($string);
        const table: [unknown, number | string, string[]][] = [-Infinity, -2.5, -2, 2.5, Infinity, NaN, 'hoge'].map(property => {
          const source = { [property]: 1 }
          return [source, property, Object.assign([], source)];
        });
        test.each(table)(
          `制約が配列型であるとき、 'value' が 'Object.assign([], %p)' であれば 'wrap(...)[%p]' にアクセスしたときに '1' を必ず返す`,
          (_, property, value) => {
            const wrapped = wrap(value, constraint) as string[] & { [x: string]: unknown };
            expect(wrapped[property]).toEqual(1);
          }
        );
      }
    );
  });

  describe('ひとつのオブジェクトに対して常に同一の Proxy を返す', () => {
    const a = { b: 1 } as const;
    const json = { a, c: { a } };
    const wrapped = wrap(json, $object({
      a: $object({ b: $number }),
      c: $object({
        a: $object({
          b: $number
        })
      })
    }));

    describe('ひとつのプロパティに対して常に同一の Proxy を返す', () => {
      test(`'wrap(...).a' は常に同一の Proxy を返す`, () => {
        expect(wrapped.a).toBe(wrapped.a);
      });

      test(`'wrap(...).c.a' は常に同一の Proxy を返す`, () => {
        expect(wrapped.c.a).toBe(wrapped.c.a);
      });
    });

    describe('異なるプロパティにセットされた同一のオブジェクトに対し、同一の Proxy を返す', () => {
      test(`'value.a === value.c.a' である場合、 'wrap(...).a === wrap(...).c.a' である`, () => {
        expect(wrapped.c.a).toBe(wrapped.a);
      })
    });
  });
});
