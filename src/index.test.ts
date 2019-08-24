import wrap, { anyNumber, anyString } from ".";

describe('wrap()', () => {

  test.each`
    typeName       | constraint   | value
    ${'string'}    | ${anyString} | ${''}
    ${'string'}    | ${anyString} | ${'hoge'}
    ${'fuga'}      | ${'fuga'}    | ${'fuga'}
    ${'number'}    | ${anyNumber} | ${0}
    ${'number'}    | ${anyNumber} | ${1}
    ${'2'}         | ${2}         | ${2}
    ${'null'}      | ${null}      | ${null}
    ${'undefined'} | ${undefined} | ${undefined}
  `(`型 '$typeName' が期待されているとき、値が '$value' であればその値を返す`, ({ constraint, value }) => {
    const wrapped = wrap({ a: value } as any, { a: constraint });
    expect(wrapped.a).toBe(value);
  });

  test.each`
    typeName       | constraint   | value
    ${'string'}    | ${anyString} | ${1}
    ${'string'}    | ${anyString} | ${null}
    ${'string'}    | ${anyString} | ${undefined}
    ${'fuga'}      | ${'fuga'}    | ${'hoge'}
    ${'fuga'}      | ${'fuga'}    | ${1}
    ${'fuga'}      | ${'fuga'}    | ${null}
    ${'fuga'}      | ${'fuga'}    | ${undefined}
    ${'number'}    | ${anyNumber} | ${'hoge'}
    ${'number'}    | ${anyNumber} | ${null}
    ${'number'}    | ${anyNumber} | ${undefined}
    ${'2'}         | ${2}         | ${'hoge'}
    ${'2'}         | ${2}         | ${1}
    ${'2'}         | ${2}         | ${null}
    ${'2'}         | ${2}         | ${undefined}
    ${'null'}      | ${null}      | ${'hoge'}
    ${'null'}      | ${null}      | ${1}
    ${'null'}      | ${null}      | ${undefined}
    ${'undefined'} | ${undefined} | ${'hoge'}
    ${'undefined'} | ${undefined} | ${1}
    ${'undefined'} | ${undefined} | ${null}
  `(`型 '$typeName' が期待されているとき、値が '$value' であれば TypeError を投げる`, ({ constraint, value }) => {
    const wrapped = wrap({ a: value } as any, { a: constraint });
    expect(() => { wrapped.a }).toThrow(TypeError);
  });

});
