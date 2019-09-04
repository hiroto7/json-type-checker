import Constraint, { $string, $const, $number, $boolean, $true, $false, $undefined, $null } from "./Constraint";
import checkPrimitiveTypes from "./checkPrimitiveTypes";

describe('checkPrimitiveTypes()', () => {
  describe(`値が期待されている型である場合、 'true' を返す`, () => {
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
      [$undefined, undefined]
    ] as const).map(([constraint, value]): [string, unknown, Constraint] => [constraint.typeName, value, constraint]);

    test.each(table)(
      `型 '%s' が期待されているとき、値が '%p' であれば 'true' を返す`,
      (_, value, constraint) => {
        expect(checkPrimitiveTypes(value, constraint)).toBeTruthy();
      });
  });

  describe(`値が期待されいている型でない場合、 'false' を返す`, () => {
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
      [$undefined, {}]
    ] as const).map(([constraint, value]): [string, unknown, Constraint] => [constraint.typeName, value, constraint]);

    test.each(table)(
      `型 '%s' が期待されているとき、値が '%p' であれば 'false' を返す`,
      (_, value, constraint) => {
        expect(checkPrimitiveTypes(value, constraint)).toBeFalsy();
      });
  });
});
