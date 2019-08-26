import getTypeName from "./getTypeName";

export interface Constraint { readonly constraintName: string; readonly typeName: string; }
export namespace Constraint {
  export const isConstraint =
    (obj: unknown): obj is Constraint => obj instanceof Object && 'constraintName' in obj && 'typeName' in obj;
}
export default Constraint;

export class AnyNumber implements Constraint { readonly constraintName = 'number'; readonly typeName = 'number'; }
export class AnyString implements Constraint { readonly constraintName = 'string'; readonly typeName = 'string'; }
export class AnyBoolean implements Constraint { readonly constraintName = 'boolean'; readonly typeName = 'boolean'; }

export const anyNumber = new AnyNumber;
export const anyString = new AnyString;
export const anyBoolean = new AnyBoolean;

export class ArrayConstraint<T> implements Constraint {
  readonly constraintName = 'array';
  get typeName(): string {
    if (this.child instanceof Union) {
      return `(${this.child.typeName})[]`
    } else {
      return `${getTypeName(this.child)}[]`
    }
  }
  constructor(readonly child: T) { }
}
export const arrayConstraint = <T>(childType: T): ArrayConstraint<T> => new ArrayConstraint(childType);

export class Union<TS extends readonly unknown[]> implements Constraint {
  readonly constraintName = 'union';
  private readonly _children: TS;
  get typeName(): string { return this._children.map(type => getTypeName(type)).join(' | ') }
  constructor(...children: TS) { this._children = children; }
  *children() { yield* this._children; }
}
export const union = <TS extends readonly unknown[]>(...types: TS): TS[0] | Union<TS> => {
  const map: Map<string, unknown> = new Map();
  for (const type of types) {
    if (!(type instanceof NeverConstraint)) {
      map.set(getTypeName(type), type);
    }
  }
  return map.size === 0 ? neverConstraint :
    map.size === 1 ? [...map.values()][0] :
      new Union(...map.values());
}

export class NeverConstraint implements Constraint { readonly constraintName = 'never'; readonly typeName = 'never'; }
export const neverConstraint = new NeverConstraint;