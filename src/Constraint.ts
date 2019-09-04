import prettyFormat from 'pretty-format';

export interface Constraint { readonly constraintName: string; readonly typeName: string; }
export namespace Constraint {
  export const isConstraint =
    (obj: unknown): obj is Constraint => obj instanceof Object && 'constraintName' in obj && 'typeName' in obj;
}
export default Constraint;

export class NumberConstraint implements Constraint { readonly constraintName = 'number'; readonly typeName = 'number'; }
export class StringConstraint implements Constraint { readonly constraintName = 'string'; readonly typeName = 'string'; }
export class BooleanConstraint implements Constraint { readonly constraintName = 'boolean'; readonly typeName = 'boolean'; }

export const $number = new NumberConstraint;
export const $string = new StringConstraint;
export const $boolean = new BooleanConstraint;

export class ConstantConstraint<V extends string | number | boolean | null | undefined> implements Constraint {
  readonly constraintName = 'constant';
  get typeName(): string { return prettyFormat(this.value); }
  constructor(readonly value: V) { }
}
export const $const =
  <V extends string | number | boolean | null | undefined>(value: V): ConstantConstraint<V> => new ConstantConstraint(value);

export const $true = $const(true);
export const $false = $const(false);
export const $null = $const(null);
export const $undefined = $const(undefined);

export class ObjectConstraint<O extends object & { [P in keyof O]: Constraint }> implements Constraint {
  readonly constraintName = 'object';
  get typeName(): string {
    if (Array.isArray(this.obj)) {
      return `[${this.obj.map((value: Constraint) => value.typeName).join(', ')}]`
    } else {
      const keys = Object.keys(this.obj) as (keyof O)[];
      const entries = Object.entries(this.obj) as [keyof O, O[keyof O]][];
      return keys.length === 0 ?
        '{}' :
        '{ ' + entries.map(([key, value]) => `"${key}": ${value.typeName};`).join(' ') + ' }';
    }
  }
  constructor(readonly obj: O) { }
}
export const $object = <O extends object & { [P in keyof O]: Constraint }>(obj: O) => new ObjectConstraint(obj);

export class ArrayConstraint<C extends Constraint> implements Constraint {
  readonly constraintName = 'array';
  get typeName(): string {
    if (this.child instanceof UnionConstraint) {
      return `(${this.child.typeName})[]`
    } else {
      return `${this.child.typeName}[]`
    }
  }
  constructor(readonly child: C) { }
}
export const $array = <C extends Constraint>(childType: C): ArrayConstraint<C> => new ArrayConstraint(childType);

export class UnionConstraint<CS extends readonly Constraint[]> implements Constraint {
  readonly constraintName = 'union';
  private readonly _children: CS;
  get typeName(): string { return this._children.map(type => type.typeName).join(' | ') }
  constructor(...children: CS) { this._children = children; }
  *children() { yield* this._children; }
}
export const $union = <CS extends readonly Constraint[]>(...children: CS): NeverConstraint | CS[0] | UnionConstraint<CS> => {
  const map: Map<string, Constraint> = new Map();
  for (const child of children) {
    if (!(child instanceof NeverConstraint)) {
      map.set(child.typeName, child);
    }
  }
  return map.size === 0 ? $never :
    map.size === 1 ? [...map.values()][0] :
      new UnionConstraint(...map.values());
}

export class NeverConstraint implements Constraint { readonly constraintName = 'never'; readonly typeName = 'never'; }
export const $never = new NeverConstraint;
