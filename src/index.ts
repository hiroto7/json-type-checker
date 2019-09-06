import Constraint, { $never, $union, ArrayConstraint, BooleanConstraint, ConstantConstraint, NeverConstraint, NumberConstraint, ObjectConstraint, StringConstraint, UnionConstraint } from "./Constraint";
import JSONTypeError from './JSONTypeError';

type JSONType<C extends Constraint> =
  C extends NumberConstraint ? number :
  C extends StringConstraint ? string :
  C extends BooleanConstraint ? boolean :
  C extends ArrayConstraint<infer D> ? { 0: JSONType<D>[] }[D extends D ? 0 : never] :
  C extends UnionConstraint<readonly (infer CS & Constraint)[]> ? (
    CS extends Constraint ? { 0: JSONType<CS> }[C extends C ? 0 : never] :
    never) :
  C extends ObjectConstraint<infer D> ? { [P in (number | string) & keyof D]: JSONType<D[P]> } :
  C extends ConstantConstraint<infer D> ? D :
  C extends NeverConstraint ? never :
  unknown;

const getConstraintChild = (constraint: Constraint, property: string | number): Constraint | null => {
  if (constraint instanceof UnionConstraint) {
    const childChildren: Set<Constraint> = new Set;
    for (const child of constraint.children()) {
      const childChild =
        getConstraintChild(child, property);
      if (childChild === null) { return null; }
      if (!(childChild instanceof NeverConstraint)) {
        childChildren.add(childChild);
      }
    }
    return $union(...childChildren);
  } else if (!(constraint instanceof ObjectConstraint)) {
    return $never;
  } else if (!(property in constraint.obj)) {
    return null;
  } else {
    return constraint.obj[property];
  }
}

const wrap = <C extends Constraint>(json: JSONType<C> & object, constraint: C, jsonToProxy = new Map): JSONType<C> => new Proxy(json, {
  get(target, property: (number | string) & keyof C) {
    const targetChild = Reflect.get(target, property);
    const constraintChild = getConstraintChild(constraint, property);

    try {
      if (constraintChild === null) {
        return targetChild;
      } else {
        constraintChild.check1(targetChild);

        if (targetChild instanceof Object) {
          if (!jsonToProxy.has(targetChild)) {
            jsonToProxy.set(
              targetChild,
              wrap(targetChild, constraintChild, jsonToProxy));
          }
          return jsonToProxy.get(targetChild)!;
        } else {
          return targetChild;
        }
      }
    } catch (e) {
      throw new JSONTypeError(`Types of property '${property}' are incompatible.`, [e]);
    }
  }
});

export { $array, $boolean, $const, $false, $null, $number, $object, $string, $true, $undefined, $union } from "./Constraint";
export default wrap;
