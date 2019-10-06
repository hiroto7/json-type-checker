import prettyFormat from 'pretty-format';
import { CheckerError1, CheckerError2, ErrorWithChildren } from './CheckerError';
import ExpectedType from './ExpectedType';

interface Constraint {
  readonly typeName: 'constraint';
  readonly constraintName: string;
  readonly priority: number;
  typeExpression(encloses?: boolean): string;
  // isCompatible(value: unknown): value is ExpectedType<this>;
  isCompatible(value: unknown): boolean;
  check(value: unknown): void;
  checkOnlySurface(value: unknown): void;
  getChildByProperty(property: string | number | symbol): Constraint | null;
}
namespace Constraint {
  export const isConstraint =
    (obj: unknown): obj is Constraint => obj instanceof Object && 'typeName' in obj && obj['typeName'] === 'constraint';
}
export default Constraint;

abstract class AbstractConstraint implements Constraint {
  readonly typeName = 'constraint';
  abstract readonly constraintName: string;
  abstract readonly priority: number;
  abstract typeExpression(encloses?: boolean): string;
  abstract check(value: unknown): void;
  abstract checkOnlySurface(value: unknown): void;
  abstract getChildByProperty(property: string | number | symbol): Constraint | null;
  isCompatible(value: unknown): value is ExpectedType<this> {
    try {
      this.check(value);
      return true;
    } catch {
      return false;
    }
  }
}

abstract class ConstraintWithoutChildren extends AbstractConstraint {
  check(value: unknown) { this.checkOnlySurface(value); }
  getChildByProperty(_: string | number | symbol) { return $never; }
}

abstract class StringOrNumberOrBooleanConstraint<ConstraintName extends 'string' | 'number' | 'boolean'> extends ConstraintWithoutChildren {
  constructor(readonly constraintName: ConstraintName) { super(); }
  typeExpression(): ConstraintName { return this.constraintName; }
  checkOnlySurface(value: unknown) {
    if (typeof value !== this.constraintName) { throw new CheckerError1(value, this); }
  }
}

export class StringConstraint extends StringOrNumberOrBooleanConstraint<'string'> {
  readonly priority = 1;
  constructor() { super('string'); }
}
export class NumberConstraint extends StringOrNumberOrBooleanConstraint<'number'> {
  readonly priority = 2;
  constructor() { super('number'); }
}
export class BooleanConstraint extends StringOrNumberOrBooleanConstraint<'boolean'> {
  readonly priority = 3;
  constructor() { super('boolean'); }
}

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
  constructor(readonly value: V) { super(); }
  typeExpression(): string { return prettyFormat(this.value); }
  checkOnlySurface(value: unknown) {
    if (value !== this.value) { throw new CheckerError1(value, this); }
  }
}
export const $const =
  <V extends string | number | boolean | null | undefined>(value: V): ConstantConstraint<V> => new ConstantConstraint(value);

export const $true = $const(true);
export const $false = $const(false);
export const $null = $const(null);
export const $undefined = $const(undefined);

export class ObjectConstraint<O extends { [P in keyof O]: ObjectConstraint.PropertyDescriptor<Constraint, boolean> }> extends AbstractConstraint {
  readonly constraintName = 'object';
  readonly priority = 6;
  constructor(readonly obj: O) { super(); }
  typeExpression(): string {
    if (Array.isArray(this.obj)) {
      return `[${this.obj.map(
        (descriptor: ObjectConstraint.PropertyDescriptor<Constraint, boolean>) =>
          descriptor instanceof ObjectConstraint.OptionalPropertyDescriptor ? `${descriptor.value.typeExpression(true)}?` : descriptor.value.typeExpression()).join(', ')
        }]`
    } else {
      const keys = Object.keys(this.obj) as (keyof O)[];
      const entries = Object.entries(this.obj) as [keyof O, O[keyof O]][];
      return keys.length === 0 ?
        '{}' :
        `{ ${entries.map(
          ([key, descriptor]) => `"${key}"${descriptor instanceof ObjectConstraint.OptionalPropertyDescriptor ? '?' : ''}: ${descriptor.value.typeExpression()};`
        ).join(' ')} }`;
    }
  }
  check(value: unknown) {
    this.checkOnlySurface(value);
    for (const [property, descriptor] of Object.entries(this.obj) as [keyof O, O[keyof O]][]) {
      try {
        const childValue = Reflect.get(value, property);
        descriptor.value.check(childValue);
      } catch (e) {
        e = new ErrorWithChildren(new CheckerError2(property), e);
        e = new ErrorWithChildren(new CheckerError1(value, this), e);
        throw e;
      }
    }
  }
  checkOnlySurface(value: unknown): asserts value is object {
    if (!(value instanceof Object)) { throw new CheckerError1(value, this); }
  }
  getChildByProperty(property: string | number | symbol): Constraint | null {
    if (((property: string | number | symbol): property is keyof O => property in this.obj)(property)) {
      return this.obj[property].value;
    } else {
      return null;
    }
  }
}
export namespace ObjectConstraint {
  export abstract class PropertyDescriptor<C extends Constraint, IsRequired extends boolean> {
    abstract readonly isRequired: IsRequired;
    readonly typeName = 'object-constraint-property-descriptor';
    constructor(readonly value: C) { }
  }

  export class RequiredPropertyDescriptor<C extends Constraint> extends PropertyDescriptor<C, true>{
    readonly isRequired = true;
  }

  export class OptionalPropertyDescriptor<C extends Constraint> extends PropertyDescriptor<C, false>{
    readonly isRequired = false
  }
}

export const $required = <C extends Constraint>(value: C) => new ObjectConstraint.RequiredPropertyDescriptor(value);
export const $optional = <C extends Constraint>(value: C) => new ObjectConstraint.OptionalPropertyDescriptor($union(value, $undefined));

type CorrectedObjectConstraintInit<O extends { [P in keyof O]: Constraint | ObjectConstraint.PropertyDescriptor<Constraint, boolean> }> = {
  [P in keyof O]: O[P] extends Constraint ? ObjectConstraint.RequiredPropertyDescriptor<O[P]> : O[P] extends ObjectConstraint.PropertyDescriptor<Constraint, boolean> ? O[P] : never
};
export const $object = <O extends { [P in keyof O]: Constraint | ObjectConstraint.PropertyDescriptor<Constraint, boolean> }>(obj: O): ObjectConstraint<CorrectedObjectConstraintInit<O>> => {
  if (Array.isArray(obj)) {
    const correctedArray = obj.map((value: Constraint | ObjectConstraint.PropertyDescriptor<Constraint, boolean>) =>
      Constraint.isConstraint(value) ? $required(value) : value
    ) as ObjectConstraint.PropertyDescriptor<Constraint, boolean>[] & CorrectedObjectConstraintInit<O>;
    return new ObjectConstraint(correctedArray);
  } else {
    const correctedObj: { [P in keyof O]: Constraint | ObjectConstraint.PropertyDescriptor<Constraint, boolean> } = { ...obj };
    const entries = Object.entries(obj) as [keyof O, O[keyof O]][];
    for (const [property, descriptorOrConstraint] of entries) {
      const descriptor = Constraint.isConstraint(descriptorOrConstraint) ? $required(descriptorOrConstraint) : descriptorOrConstraint as ObjectConstraint.PropertyDescriptor<Constraint, boolean>;
      correctedObj[property] = descriptor;
    }
    return new ObjectConstraint(correctedObj as CorrectedObjectConstraintInit<O>);
  }
}

export class ArrayConstraint<C extends Constraint> extends AbstractConstraint {
  readonly constraintName = 'array';
  readonly priority = 6;
  constructor(readonly child: C) { super(); }
  typeExpression(): string { return this.child.typeExpression(true) + '[]'; }
  check(value: unknown) {
    this.checkOnlySurface(value);
    for (const [index, childValue] of value.entries()) {
      try {
        this.child.check(childValue);
      } catch (e) {
        e = new ErrorWithChildren(new CheckerError2(index), e);
        e = new ErrorWithChildren(new CheckerError1(value, this), e);
        throw e;
      }
    }
  }
  checkOnlySurface(value: unknown): asserts value is unknown[] {
    if (!(value instanceof Array)) { throw new CheckerError1(value, this); }
  }
  getChildByProperty(property: string | number | symbol): C | null {
    if (typeof property === 'symbol') {
      return null;
    } else {
      if (typeof property === 'string') {
        property = Number.parseFloat(property);
      }
      return Number.isInteger(property) && property >= 0 ? this.child : null;
    }
  }
}
export const $array = <C extends Constraint>(childType: C): ArrayConstraint<C> => new ArrayConstraint(childType);

export class UnionConstraint<CS extends readonly Constraint[]> extends AbstractConstraint {
  readonly constraintName = 'union';
  readonly priority = 0;
  private readonly _children: CS;
  constructor(...children: CS) { super(); this._children = children; }
  *children() { yield* this._children; }
  typeExpression(encloses?: boolean): string {
    const result = this._children.map(type => type.typeExpression()).join(' | ');
    return encloses ? `(${result})` : result;
  }
  check(value: unknown) {
    const errors: Set<unknown> = new Set;
    for (const child of this.children()) {
      try {
        child.check(value);
      } catch (e) {
        if (e instanceof ErrorWithChildren && [...e.children()].length !== 0) { errors.add(e); }
        continue;
      }
      return;
    }
    throw new ErrorWithChildren(new CheckerError1(value, this), ...errors);
  }
  checkOnlySurface(value: unknown) {
    for (const child of this.children()) {
      try {
        child.checkOnlySurface(value);
      } catch (e) {
        continue;
      }
      return;
    }
    throw new CheckerError1(value, this);
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
        map.set(childChild.typeExpression(false), childChild);
      }
    } else if (!(child instanceof NeverConstraint)) {
      map.set(child.typeExpression(false), child);
    }
  }
  return map.size === 0 ? $never :
    map.size === 1 ? [...map.values()][0] :
      new UnionConstraint(...[...map.values()].sort((a, b) => a.priority - b.priority));
}

export class NeverConstraint extends ConstraintWithoutChildren {
  readonly constraintName = 'never';
  readonly priority = 0;
  typeExpression() { return 'never'; }
  checkOnlySurface(value: unknown): void {
    throw new CheckerError1(value, this);
  }
}
export const $never = new NeverConstraint;
