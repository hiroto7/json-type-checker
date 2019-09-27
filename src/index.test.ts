import CheckerError from "./CheckerError";
import Constraint from "./Constraint";
import wrap, { $boolean, $number, $object, $union } from "./index";

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
      `'value.a' に対応する制約が存在しない場合、 'wrap(...).a' を参照したときにその値を返す`,
      () => {
        const constraint = $object({ a: $number });
        const table: [{ a: number, b: unknown }, unknown][] = [
          [{ a: 1, b: 2 }, 2],
          [{ a: 1, b: {} }, {}],
        ]
        test.each(table)(
          `'value.a' に対応する制約が存在しないとき、 'value' が '%p' であれば 'wrap(...).a' を参照したときに '%p' を返す`,
          (value0, value1) => {
            const wrapped = wrap(value0, constraint) as any;
            expect(wrapped.b).toEqual(value1);
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

  describe('同一のオブジェクトに対し同一の Proxy を返す', () => {
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

    describe('同一のプロパティに対し同一の Proxy を返す', () => {
      test('.a に対して', () => {
        expect(wrapped.a).toBe(wrapped.a);
      });

      test('.c.a に対して', () => {
        expect(wrapped.c.a).toBe(wrapped.c.a);
      });
    });

    test('異なるプロパティにセットされた同一のオブジェクトに対し同一の Proxy を返す', () => {
      expect(wrapped.c.a).toBe(wrapped.a);
    })
  });
});
