import Constraint, { ArrayConstraint, BooleanConstraint, ConstantConstraint, NeverConstraint, NumberConstraint, ObjectConstraint, StringConstraint, UnionConstraint } from "./Constraint";

type PrimitiveType<C extends Constraint> =
  C extends NumberConstraint ? number :
  C extends StringConstraint ? string :
  C extends BooleanConstraint ? boolean :
  C extends ArrayConstraint<Constraint> ? object :
  C extends UnionConstraint<readonly (infer CS & Constraint)[]> ? (
    CS extends Constraint ? { 0: PrimitiveType<CS> }[C extends C ? 0 : never] :
    never) :
  C extends ObjectConstraint<object> ? object :
  C extends ConstantConstraint<infer D> ? D :
  C extends NeverConstraint ? never :
  unknown;

const checkPrimitiveTypes = <C extends Constraint>(value: unknown, constraint: C): value is PrimitiveType<C> => {
  if (constraint instanceof UnionConstraint) {
    for (const child of constraint.children()) {
      if (!checkPrimitiveTypes(value, child)) { continue; }
      return true;
    }
    return false;
  } else if (constraint instanceof BooleanConstraint || constraint instanceof NumberConstraint || constraint instanceof StringConstraint) {
    return typeof value === constraint.typeName;
  } else if (constraint instanceof ObjectConstraint) {
    return value instanceof Object;
  } else if (constraint instanceof ConstantConstraint) {
    return value === constraint.value;
  } else {
    return false;
  }
};

export default checkPrimitiveTypes;