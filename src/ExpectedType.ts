import Constraint, { ArrayConstraint, BooleanConstraint, ConstantConstraint, NeverConstraint, NumberConstraint, ObjectConstraint, StringConstraint, UnionConstraint } from "./Constraint";

type ExpectedType<C extends Constraint> =
  C extends NumberConstraint ? number :
  C extends StringConstraint ? string :
  C extends BooleanConstraint ? boolean :
  C extends ArrayConstraint<infer D> ? ExpectedType<D>[] :
  C extends UnionConstraint<readonly (infer CS & Constraint)[]> ? (
    CS extends Constraint ? { 0: ExpectedType<CS> }[C extends C ? 0 : never] :
    never) :
  C extends ObjectConstraint<infer O> ? (
    { [P in RequiredKeys<O>]: ExpectedType<O[P]['value']> } &
    { [P in OptionalKeys<O>]?: ExpectedType<O[P]['value']> }
  ) & (O extends readonly ObjectConstraint.PropertyDescriptor<infer D, boolean>[] ? ExpectedType<D>[] : unknown) :
  C extends ConstantConstraint<infer D> ? D :
  C extends NeverConstraint ? never :
  unknown;

type RequiredKeys<O extends { [P in keyof O]: ObjectConstraint.PropertyDescriptor<Constraint, boolean> }> = {
  [P in keyof O]: O[P] extends ObjectConstraint.RequiredPropertyDescriptor<Constraint> ? P : never;
}[keyof O];
type OptionalKeys<O extends { [P in keyof O]: ObjectConstraint.PropertyDescriptor<Constraint, boolean> }> = {
  [P in keyof O]: O[P] extends ObjectConstraint.OptionalPropertyDescriptor<Constraint> ? P : never;
}[keyof O];

export default ExpectedType;