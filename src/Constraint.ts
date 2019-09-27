import prettyFormat from 'pretty-format';
import { ErrorWithChildren, CheckerError1 } from './CheckerError';
export interface Constraint {
  readonly constraintName: string;
  readonly typeName: string;
  readonly priority: number;
  check1(value: unknown): void;
  getChildByProperty(property: string | number | symbol): Constraint | null;
}
export namespace Constraint {
  export const isConstraint =
    (obj: unknown): obj is Constraint => obj instanceof Object && 'constraintName' in obj && 'typeName' in obj;
}
export default Constraint;

abstract class ConstraintWithoutChildren implements Constraint {
  abstract readonly constraintName: string;
  abstract readonly typeName: string;
  abstract readonly priority: number;
  abstract check1(value: unknown): void;
  getChildByProperty(_: string | number | symbol) { return $never; }
}

abstract class StringOrNumberOrBooleanConstraint<ConstraintName extends 'string' | 'number' | 'boolean'> extends ConstraintWithoutChildren {
  constructor(readonly constraintName: ConstraintName, readonly priority: number) { super(); }
  get typeName(): ConstraintName { return this.constraintName; }
  check1(value: unknown) {
    if (typeof value !== this.constraintName) { throw new CheckerError1(value, this); }
  }
}

export class StringConstraint extends StringOrNumberOrBooleanConstraint<'string'> { constructor() { super('string', 1); } }
export class NumberConstraint extends StringOrNumberOrBooleanConstraint<'number'> { constructor() { super('number', 2); } }
export class BooleanConstraint extends StringOrNumberOrBooleanConstraint<'boolean'> { constructor() { super('boolean', 3); } }

export const $number = new NumberConstraint;
export const $string = new StringConstraint;
export const $boolean = new BooleanConstraint;

export class ConstantConstraint<V extends string | number | boolean | null | undefined> extends ConstraintWithoutChildren {
  get priority(): number {
    if (this.value === undefined) { return 99; }
    else if (this.value === null) { return 98; }
    else if (typeof this.value === 'boolean') { return 4; }
    else { return 5; }
  }
  readonly constraintName = 'constant';
  get typeName(): string { return prettyFormat(this.value); }
  constructor(readonly value: V) { super(); }
  check1(value: unknown) {
    if (value !== this.value) { throw new CheckerError1(value, this); }
  }
}
export const $const =
  <V extends string | number | boolean | null | undefined>(value: V): ConstantConstraint<V> => new ConstantConstraint(value);

export const $true = $const(true);
export const $false = $const(false);
export const $null = $const(null);
export const $undefined = $const(undefined);

export class ObjectConstraint<O extends object & { [P in keyof O]: Constraint }> implements Constraint {
  getChildByProperty(property: string | number | symbol): Constraint | null {
    if (((property: string | number | symbol): property is keyof O => property in this.obj)(property)) {
      return this.obj[property];
    } else {
      return null;
    }
  }
  readonly constraintName = 'object';
  readonly priority: number = 6;
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
  check1(value: unknown) {
    if (!(value instanceof Object)) { throw new CheckerError1(value, this); }
  }
}
export const $object = <O extends object & { [P in keyof O]: Constraint }>(obj: O) => new ObjectConstraint(obj);

export class ArrayConstraint<C extends Constraint> implements Constraint {
  readonly constraintName = 'array';
  readonly priority: number = 6;
  get typeName(): string {
    if (this.child instanceof UnionConstraint) {
      return `(${this.child.typeName})[]`
    } else {
      return `${this.child.typeName}[]`
    }
  }
  constructor(readonly child: C) { }
  check1(value: unknown) {
    if (!(value instanceof Array)) { throw new CheckerError1(value, this); };
  }
  getChildByProperty(property: string | number | symbol): C | null {
    if (typeof property === 'symbol') {
      return null;
    } else if (typeof property === 'string') {
      return Number.isInteger(Number.parseFloat(property)) ? this.child : null;
    } else {
      return Number.isInteger(property) ? this.child : null;
    }
  }
}
export const $array = <C extends Constraint>(childType: C): ArrayConstraint<C> => new ArrayConstraint(childType);

export class UnionConstraint<CS extends readonly Constraint[]> implements Constraint {
  readonly constraintName = 'union';
  readonly priority: number = 0;
  private readonly _children: CS;
  get typeName(): string { return this._children.map(type => type.typeName).join(' | ') }
  constructor(...children: CS) { this._children = children; }
  *children() { yield* this._children; }
  check1(value: unknown) {
    const errors: Set<unknown> = new Set;
    for (const child of this.children()) {
      try {
        child.check1(value);
      } catch (e) {
        errors.add(e);
        continue;
      }
      return;
    }
    throw new ErrorWithChildren(new CheckerError1(value, this), ...errors);
  }
  getChildByProperty(property: string | number | symbol): Constraint | null {
    const childChildren: Set<Constraint> = new Set;
    for (const child of this.children()) {
      const childChild = child.getChildByProperty(property);
      if (childChild === null) { return null; }
      if (!(childChild instanceof NeverConstraint)) {
        childChildren.add(childChild);
      }
    }
    return $union(...childChildren);
  }
}
export const $union = <CS extends readonly Constraint[]>(...children: CS): NeverConstraint | CS[0] | UnionConstraint<CS> => {
  const map: Map<string, Constraint> = new Map();
  for (const child of children) {
    if (child instanceof UnionConstraint) {
      for (const childChild of child.children()) {
        map.set(childChild.typeName, childChild);
      }
    } else if (!(child instanceof NeverConstraint)) {
      map.set(child.typeName, child);
    }
  }
  return map.size === 0 ? $never :
    map.size === 1 ? [...map.values()][0] :
      new UnionConstraint(...[...map.values()].sort((a, b) => a.priority - b.priority));
}

export class NeverConstraint extends ConstraintWithoutChildren {
  readonly constraintName = 'never';
  readonly typeName = 'never';
  readonly priority = 0;
  check1(value: unknown): void {
    throw new CheckerError1(value, this);
  }
}
export const $never = new NeverConstraint;
