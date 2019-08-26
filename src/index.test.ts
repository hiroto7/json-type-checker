import wrap, { anyBoolean, anyNumber, anyString, JSONTypeError, union } from "./index";

describe('wrap()', () => {

  describe('制約で未定義のプロパティのアサーション', () => {
    const constraint = { a: anyNumber };

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

  describe('プリミティブ型のアサーション', () => {

    test.each`
      typeName       | constraint    | value
      ${'string'}    | ${anyString}  | ${''}
      ${'string'}    | ${anyString}  | ${'hoge'}
      ${'fuga'}      | ${'fuga'}     | ${'fuga'}
      ${'number'}    | ${anyNumber}  | ${0}
      ${'number'}    | ${anyNumber}  | ${1}
      ${'2'}         | ${2}          | ${2}
      ${'boolean'}   | ${anyBoolean} | ${true}
      ${'boolean'}   | ${anyBoolean} | ${false}
      ${'true'}      | ${true}       | ${true}
      ${'false'}     | ${false}      | ${false}
      ${'null'}      | ${null}       | ${null}
      ${'undefined'} | ${undefined}  | ${undefined}
  `(`型 '$typeName' が期待されているとき、値が '$value' であればその値を返す`, ({ constraint, value }) => {
      const wrapped = wrap({ a: value }, { a: constraint });
      expect(wrapped.a).toBe(value);
    });

    test.each`
      typeName       | constraint    | value
      ${'string'}    | ${anyString}  | ${1}
      ${'string'}    | ${anyString}  | ${false}
      ${'string'}    | ${anyString}  | ${null}
      ${'string'}    | ${anyString}  | ${undefined}
      ${'string'}    | ${anyString}  | ${{}}
      ${'fuga'}      | ${'fuga'}     | ${'hoge'}
      ${'fuga'}      | ${'fuga'}     | ${1}
      ${'fuga'}      | ${'fuga'}     | ${false}
      ${'fuga'}      | ${'fuga'}     | ${null}
      ${'fuga'}      | ${'fuga'}     | ${undefined}
      ${'fuga'}      | ${'fuga'}     | ${{}}
      ${'number'}    | ${anyNumber}  | ${'hoge'}
      ${'number'}    | ${anyNumber}  | ${false}
      ${'number'}    | ${anyNumber}  | ${null}
      ${'number'}    | ${anyNumber}  | ${undefined}
      ${'number'}    | ${anyNumber}  | ${{}}
      ${'2'}         | ${2}          | ${'hoge'}
      ${'2'}         | ${2}          | ${1}
      ${'2'}         | ${2}          | ${false}
      ${'2'}         | ${2}          | ${null}
      ${'2'}         | ${2}          | ${undefined}
      ${'2'}         | ${2}          | ${{}}
      ${'boolean'}   | ${anyBoolean} | ${'hoge'}
      ${'boolean'}   | ${anyBoolean} | ${1}
      ${'boolean'}   | ${anyBoolean} | ${null}
      ${'boolean'}   | ${anyBoolean} | ${undefined}
      ${'boolean'}   | ${anyBoolean} | ${{}}
      ${'true'}      | ${true}       | ${'hoge'}
      ${'true'}      | ${true}       | ${1}
      ${'true'}      | ${true}       | ${false}
      ${'true'}      | ${true}       | ${null}
      ${'true'}      | ${true}       | ${undefined}
      ${'true'}      | ${true}       | ${{}}
      ${'null'}      | ${null}       | ${'hoge'}
      ${'null'}      | ${null}       | ${1}
      ${'null'}      | ${null}       | ${false}
      ${'null'}      | ${null}       | ${undefined}
      ${'null'}      | ${null}       | ${{}}
      ${'undefined'} | ${undefined}  | ${'hoge'}
      ${'undefined'} | ${undefined}  | ${1}
      ${'undefined'} | ${undefined}  | ${false}
      ${'undefined'} | ${undefined}  | ${null}
      ${'undefined'} | ${undefined}  | ${{}}
  `(`型 '$typeName' が期待されているとき、値が '$value' であれば JSONTypeError を投げる`, ({ constraint, value }) => {
      const wrapped = wrap({ a: value } as any, { a: constraint });
      expect(() => { wrapped.a }).toThrow(JSONTypeError);
    });

    test.skip.each`
      typeName       | constraint
      ${'string'}    | ${anyString}
      ${'fuga'}      | ${'fuga'}
      ${'number'}    | ${anyNumber}
      ${'2'}         | ${2}
      ${'boolean'}   | ${anyBoolean}
      ${'true'}      | ${true}
      ${'false'}     | ${false}
      ${'null'}      | ${null}
      ${'undefined'} | ${undefined}
    `(`型 '$typeName' が期待されているとき、プロパティが存在しなければ JSONTypeError を投げる`, ({ constraint }) => {
      const wrapped = wrap({} as any, { a: constraint });
      expect(() => { wrapped.a }).toThrow(JSONTypeError);
    });

  });

  describe('オブジェクト型のアサーション', () => {

    test.each(['hoge', 1, false, null, undefined] as const)(
      `オブジェクト型が期待されているとき、値が %p であれば JSONTypeError を投げる`,
      value => {
        const wrapped = wrap({ a: value } as any, { a: {} });
        expect(() => { wrapped.a }).toThrow(JSONTypeError);
      }
    );

    test('オブジェクト型が期待されているとき、プロパティが存在しなければ JSONTypeError を投げる', () => {
      const wrapped = wrap({ b: 2 } as any, { a: {} });
      expect(() => { wrapped.a }).toThrow(JSONTypeError);
    });

    describe('.a.b に関して', () => {
      const json = { a: { b: 1 } } as const;

      test('型が正しければその値を返す', () => {
        const wrapped = wrap(json, { a: { b: anyNumber } });
        expect(wrapped.a.b).toBe(1);
      });

      test('型が誤っていれば JSONTypeError をスローする', () => {
        const wrapped = wrap(json as any, { a: { b: anyString } });
        expect(() => { wrapped.a.b }).toThrow(JSONTypeError);
      });
    });

    describe('.a.b.c に関して', () => {
      const json = { a: { b: { c: 1 } } } as const;

      test('型が正しければその値を返す', () => {
        const wrapped = wrap(json, { a: { b: { c: anyNumber } } });
        expect(wrapped.a.b.c).toBe(1);
      });

      test('型が誤っていれば JSONTypeError をスローする', () => {
        const wrapped = wrap(json as any, { a: { b: { c: anyString } } });
        expect(() => { wrapped.a.b.c }).toThrow(JSONTypeError);
      });
    });

    describe('同一のオブジェクトに対し同一の Proxy を返す', () => {
      const a = { b: 1 } as const;
      const json = { a, c: { a } };
      const wrapped = wrap(json, { a: { b: anyNumber }, c: { a: { b: anyNumber } } });

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
      const constraint = { a: union(anyBoolean, anyNumber) };

      test(`値が 'true' であればその値を返す`, () => {
        const wrapped = wrap({ a: true }, constraint);
        expect(wrapped.a).toBe(true);
      });

      test(`値が '"hoge"' であれば JSONTypeError を投げる`, () => {
        const wrapped = wrap({ a: 'hoge' } as any, constraint);
        expect(() => { wrapped.a }).toThrow(JSONTypeError);
      })
    });

    describe(`型 '{ a: boolean } | { a: number }' が期待されているとき`, () => {
      const constraint = union({ a: anyBoolean }, { a: anyNumber });

      test(`.a の値が 'true' であればその値を返す`, () => {
        const wrapped = wrap({ a: true }, constraint);
        expect(wrapped.a).toBe(true);
      });

      test(`.a の値が '"hoge"' であれば JSONTypeError を投げる`, () => {
        const wrapped = wrap({ a: 'hoge' } as any, constraint);
        expect(() => { wrapped.a }).toThrow(JSONTypeError);
      });
    });
  });

});
