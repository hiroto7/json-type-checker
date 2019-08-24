export default interface Constraint { readonly constraintName: string; }

export class AnyNumber implements Constraint { readonly constraintName = 'number'; }
export class AnyString implements Constraint { readonly constraintName = 'string'; }

export const anyNumber = new AnyNumber;
export const anyString = new AnyString;

export class ArrayConstraint<T> implements Constraint {
  readonly constraintName = 'array';
  constructor(readonly childType: T) { }
}

export class UnionConstraint<T1, T2> implements Constraint {
  readonly constraintName = 'union';
  constructor(readonly type1: T1, readonly type2: T2) { }
}
