import Constraint, { ArrayConstraint, BooleanConstraint, ConstantConstraint, NeverConstraint, NumberConstraint, ObjectConstraint, StringConstraint, UnionConstraint, ObjectConstraintOptionalPropertyDescriptor, ObjectConstraintPropertyDescriptor } from "./Constraint";

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
    { [P in OptionalKeys<O>]?: ExpectedType<O[P]['value']> }) :
  C extends ConstantConstraint<infer D> ? D :
  C extends NeverConstraint ? never :
  unknown;

type RequiredKeys<O extends { [P in keyof O]: ObjectConstraintPropertyDescriptor<Constraint, boolean> }> = Exclude<keyof O, OptionalKeys<O>>;
type OptionalKeys<O extends { [P in keyof O]: ObjectConstraintPropertyDescriptor<Constraint, boolean> }> = {
  [P in keyof O]: O[P] extends ObjectConstraintOptionalPropertyDescriptor<Constraint> ? P : never;
}[keyof O];

export default ExpectedType;