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
    if (this.childType instanceof Union) {
      return `(${this.childType.typeName})[]`
    } else {
      return `${getTypeName(this.childType)}[]`
    }
  }
  constructor(readonly childType: T) { }
}
export const arrayConstraint = <T>(childType: T): ArrayConstraint<T> => new ArrayConstraint(childType);

export class Union<TS extends readonly unknown[]> implements Constraint {
  readonly constraintName = 'union';
  readonly types: TS;
  get typeName(): string { return this.types.map(type => getTypeName(type)).join(' | ') }
  constructor(...types: TS) { this.types = types; }
}
export const union = <TS extends readonly unknown[]>(...types: TS): TS[0] | Union<TS> => {
  const map: Map<string, unknown> = new Map();
  for (const type of types) {
    map.set(getTypeName(type), type);
  }
  return map.size === 1 ? [...map.values()][0] : new Union(...map.values());
}
