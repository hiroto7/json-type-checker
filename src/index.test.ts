import CheckerError from "./CheckerError";
import wrap, { $boolean, $number, $object, $string, $union } from "./index";

describe('wrap()', () => {

  describe('制約で未定義のプロパティを参照した場合、その値を返す', () => {
    const constraint = $object({ a: $number });

    test(`制約で未定義のプロパティを参照し、値が '1' であればその値を返す`, () => {
      const json = { a: 1, b: 2 } as const;
      const wrapped = wrap(json, constraint);
      expect((wrapped as typeof json).b).toBe(2);
    });

    test(`制約で未定義のプロパティを参照し、値が '{}' であればその値を返す`, () => {
      const json = { a: 1, b: {} } as const;
      const wrapped = wrap(json, constraint);
      expect((wrapped as typeof json).b).toEqual({});
    });
  });

  describe('オブジェクト型のアサーション', () => {

    test('オブジェクト型が期待されているとき、プロパティが存在しなければ CheckerError を投げる', () => {
      const wrapped = wrap({ b: 2 } as any, $object({ a: $object({}) }));
      expect(() => { wrapped.a }).toThrow(CheckerError);
    });

    describe('.a.b に関して', () => {
      const json = { a: { b: 1 } } as const;

      test('型が正しければその値を返す', () => {
        const wrapped = wrap(json, $object({
          a: $object({
            b: $number
          })
        }));
        expect(wrapped.a.b).toBe(1);
      });

      test('型が誤っていれば CheckerError をスローする', () => {
        const wrapped = wrap(json as any, $object({
          a: $object({
            b: $string
          })
        }));
        expect(() => { wrapped.a.b }).toThrow(CheckerError);
      });
    });

    describe('.a.b.c に関して', () => {
      const json = { a: { b: { c: 1 } } } as const;

      test('型が正しければその値を返す', () => {
        const wrapped = wrap(json, $object({
          a: $object({
            b: $object({
              c: $number
            })
          })
        }));
        expect(wrapped.a.b.c).toBe(1);
      });

      test('型が誤っていれば CheckerError をスローする', () => {
        const wrapped = wrap(json as any, $object({
          a: $object({
            b: $object({
              c: $string
            })
          })
        }));
        expect(() => { wrapped.a.b.c }).toThrow(CheckerError);
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

  describe('ユニオン型のアサーション', () => {
    describe(`型 'boolean | number' が期待されているとき`, () => {
      const constraint = $object({ a: $union($boolean, $number) });

      test(`値が 'true' であればその値を返す`, () => {
        const wrapped = wrap({ a: true }, constraint);
        expect(wrapped.a).toBe(true);
      });

      test(`値が '"hoge"' であれば CheckerError を投げる`, () => {
        const wrapped = wrap({ a: 'hoge' } as any, constraint);
        expect(() => { wrapped.a }).toThrow(CheckerError);
      });
    });

    describe(`型 '{ a: boolean } | { a: number }' が期待されているとき`, () => {
      const constraint = $union($object({ a: $boolean }), $object({ a: $number }));

      test(`.a の値が 'true' であればその値を返す`, () => {
        const wrapped = wrap({ a: true }, constraint);
        expect(wrapped.a).toBe(true);
      });

      test(`.a の値が '"hoge"' であれば CheckerError を投げる`, () => {
        const wrapped = wrap({ a: 'hoge' } as any, constraint);
        expect(() => { wrapped.a }).toThrow(CheckerError);
      });
    });
  });
});
