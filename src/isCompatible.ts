import Constraint from "./Constraint";
import ExpectedType from "./ExpectedType";

const isCompatible = <C extends Constraint>(value: unknown, constraint: C): value is ExpectedType<C> => {
  try {
    constraint.check(value);
  } catch {
    return false;
  }
  return true;
}

export default isCompatible;
