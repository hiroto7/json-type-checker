import Constraint, { NumberConstraint, StringConstraint, BooleanConstraint, ArrayConstraint, UnionConstraint, ObjectConstraint, ConstantConstraint, NeverConstraint } from "./Constraint";

type ExpectedType<C extends Constraint> =
  C extends NumberConstraint ? number :
  C extends StringConstraint ? string :
  C extends BooleanConstraint ? boolean :
  C extends ArrayConstraint<infer D> ? ExpectedType<D>[] :
  C extends UnionConstraint<readonly (infer CS & Constraint)[]> ? (
    CS extends Constraint ? { 0: ExpectedType<CS> }[C extends C ? 0 : never] :
    never) :
  C extends ObjectConstraint<infer D> ? { [P in (number | string) & keyof D]: ExpectedType<D[P]> } :
  C extends ConstantConstraint<infer D> ? D :
  C extends NeverConstraint ? never :
  unknown;

export default ExpectedType;