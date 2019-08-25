import wrap, { anyNumber, anyString, anyBoolean } from ".";

describe('wrap()', () => {

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
      ${'fuga'}      | ${'fuga'}     | ${'hoge'}
      ${'fuga'}      | ${'fuga'}     | ${1}
      ${'fuga'}      | ${'fuga'}     | ${false}
      ${'fuga'}      | ${'fuga'}     | ${null}
      ${'fuga'}      | ${'fuga'}     | ${undefined}
      ${'number'}    | ${anyNumber}  | ${'hoge'}
      ${'number'}    | ${anyNumber}  | ${false}
      ${'number'}    | ${anyNumber}  | ${null}
      ${'number'}    | ${anyNumber}  | ${undefined}
      ${'2'}         | ${2}          | ${'hoge'}
      ${'2'}         | ${2}          | ${1}
      ${'2'}         | ${2}          | ${false}
      ${'2'}         | ${2}          | ${null}
      ${'2'}         | ${2}          | ${undefined}
      ${'boolean'}   | ${anyBoolean} | ${'hoge'}
      ${'boolean'}   | ${anyBoolean} | ${1}
      ${'boolean'}   | ${anyBoolean} | ${null}
      ${'boolean'}   | ${anyBoolean} | ${undefined}
      ${'true'}      | ${true}       | ${'hoge'}
      ${'true'}      | ${true}       | ${1}
      ${'true'}      | ${true}       | ${false}
      ${'true'}      | ${true}       | ${null}
      ${'true'}      | ${true}       | ${undefined}
      ${'null'}      | ${null}       | ${'hoge'}
      ${'null'}      | ${null}       | ${1}
      ${'null'}      | ${null}       | ${false}
      ${'null'}      | ${null}       | ${undefined}
      ${'undefined'} | ${undefined}  | ${'hoge'}
      ${'undefined'} | ${undefined}  | ${1}
      ${'undefined'} | ${undefined}  | ${false}
      ${'undefined'} | ${undefined}  | ${null}
  `(`型 '$typeName' が期待されているとき、値が '$value' であれば TypeError を投げる`, ({ constraint, value }) => {
      const wrapped = wrap({ a: value } as any, { a: constraint });
      expect(() => { wrapped.a }).toThrow(TypeError);
    });

  });

  describe('オブジェクト型のアサーション', () => {

    describe('.a.b に関して', () => {
      const json = { a: { b: 1 } } as const;

      test('型が正しければその値を返す', () => {
        const wrapped = wrap(json, { a: { b: anyNumber } });
        expect(wrapped.a.b).toBe(1);
      });
  
      test('型が誤っていれば TypeError をスローする', () => {
        const wrapped = wrap(json as any, { a: { b: anyString } });
        expect(() => { wrapped.a.b }).toThrow(TypeError);
      });
    });

    describe('.a.b.c に関して', () => {
      const json = { a: { b: { c: 1 } } } as const;

      test('型が正しければその値を返す', () => {
        const wrapped = wrap(json, { a: { b: { c: anyNumber } } });
        expect(wrapped.a.b.c).toBe(1);
      });
  
      test('型が誤っていれば TypeError をスローする', () => {
        const wrapped = wrap(json as any, { a: { b: { c: anyString } } });
        expect(() => { wrapped.a.b.c }).toThrow(TypeError);
      });
    });

  })

});
