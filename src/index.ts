import { AnyNumber, AnyString, ArrayConstraint, UnionConstraint } from "./Constraint";

type JSONType<Constraint> =
  Constraint extends AnyNumber ? number :
  Constraint extends AnyString ? string :
  Constraint extends ArrayConstraint<infer T> ? { 0: JSONType<T>[] }[Constraint extends Constraint ? 0 : never] :
  Constraint extends UnionConstraint<infer T1, infer T2> ? { 0: JSONType<T1> | JSONType<T2> }[Constraint extends Constraint ? 0 : never] :
  Constraint extends object ? { [P in keyof Constraint]: JSONType<Constraint[P]> } :
  Constraint;

const wrap = <Constraint extends object>(json: JSONType<Constraint>, constraint: Constraint): JSONType<Constraint> => new Proxy(json, {});

export default wrap;

