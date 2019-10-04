import Constraint, { ArrayConstraint, BooleanConstraint, ConstantConstraint, NeverConstraint, NumberConstraint, ObjectConstraint, OptionalConstraint, StringConstraint, UnionConstraint } from "./Constraint";

type ExpectedType<C extends Constraint> =
  C extends OptionalConstraint<infer D> ? { 0: ExpectedType<D> }[C extends C ? 0 : never] :
  C extends NumberConstraint ? number :
  C extends StringConstraint ? string :
  C extends BooleanConstraint ? boolean :
  C extends ArrayConstraint<infer D> ? ExpectedType<D>[] :
  C extends UnionConstraint<readonly (infer CS & Constraint)[]> ? (
    CS extends Constraint ? { 0: ExpectedType<CS> }[C extends C ? 0 : never] :
    never) :
  C extends ObjectConstraint<infer O> ? (
    { [P in RequiredKeys<O>]: ExpectedType<O[P]> } &
    { [P in OptionalKeys<O>]?: ExpectedType<O[P]> }) :
  C extends ConstantConstraint<infer D> ? D :
  C extends NeverConstraint ? never :
  unknown;

type RequiredKeys<O extends { [P in keyof O]: Constraint }> = Exclude<keyof O, OptionalKeys<O>>;
type OptionalKeys<O extends { [P in keyof O]: Constraint }> = {
  [P in keyof O]: O[P] extends OptionalConstraint<Constraint> ? P : never;
}[keyof O];

export default ExpectedType;