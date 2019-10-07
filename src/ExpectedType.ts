import Constraint, { ArrayConstraint, BooleanConstraint, ConstantConstraint, NeverConstraint, NumberConstraint, ObjectConstraint, StringConstraint, UnionConstraint, ConstraintWithEntries, TupleConstraint } from "./Constraint";

type ExpectedType<C extends Constraint> =
  C extends NumberConstraint ? number :
  C extends StringConstraint ? string :
  C extends BooleanConstraint ? boolean :
  C extends ArrayConstraint<infer D> ? ExpectedType<D>[] :
  C extends UnionConstraint<readonly (infer CS & Constraint)[]> ? (
    CS extends Constraint ? { 0: ExpectedType<CS> }[C extends C ? 0 : never] : never
  ) :
  C extends ObjectConstraint<infer O> ? (
    { [P in RequiredKeys<O>]: ExpectedType<O[P]['value']>; } &
    { [P in OptionalKeys<O>]?: ExpectedType<O[P]['value']>; }
  ) :
  C extends TupleConstraint<infer T, infer O> ? (
    { [P in RequiredKeys<O>]: ExpectedType<O[P]['value']>; } &
    { [P in OptionalKeys<O>]?: ExpectedType<O[P]['value']>; } &
    { length: Length<T>; }
  ) & (
    T extends readonly ConstraintWithEntries.PropertyDescriptor<infer D, boolean>[] ?
    ExpectedType<D>[] :
    unknown
  ) :
  C extends ConstantConstraint<infer D> ? D :
  C extends NeverConstraint ? never :
  unknown;

type RequiredKeys<O extends { [P in keyof O]: ConstraintWithEntries.PropertyDescriptor<Constraint, boolean> }> = {
  [P in keyof O]: O[P] extends ConstraintWithEntries.RequiredPropertyDescriptor<Constraint> ? P : never;
}[keyof O];
type OptionalKeys<O extends { [P in keyof O]: ConstraintWithEntries.PropertyDescriptor<Constraint, boolean> }> = {
  [P in keyof O]: O[P] extends ConstraintWithEntries.OptionalPropertyDescriptor<Constraint> ? P : never;
}[keyof O];

type Push<E, T0 extends readonly unknown[]> = ((arg: E, ...rest: T0) => void) extends ((...args: infer T1) => void) ? T1 : never;
type Pop<T0 extends readonly unknown[]> = ((...args: T0) => void) extends ((arg: never, ...rest: infer T1) => void) ? T1 : never;
type Length<D extends readonly ConstraintWithEntries.PropertyDescriptor<Constraint, boolean>[], Counter extends readonly never[] = [], Result extends number = never> = {
  0: Length<Pop<D>, Push<never, Counter>, D[0] extends ConstraintWithEntries.OptionalPropertyDescriptor<Constraint> ? Counter['length'] | Result : never>;
  1: Counter['length'] | Result;
}[D extends readonly [ConstraintWithEntries.PropertyDescriptor<Constraint, boolean>, ...ConstraintWithEntries.PropertyDescriptor<Constraint, boolean>[]] ? 0 : 1];

export default ExpectedType;