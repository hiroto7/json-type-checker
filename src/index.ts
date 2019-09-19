import Constraint, { ArrayConstraint, BooleanConstraint, ConstantConstraint, NeverConstraint, NumberConstraint, ObjectConstraint, StringConstraint, UnionConstraint } from "./Constraint";
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

const wrap = <C extends Constraint>(json: JSONType<C> & object, constraint: C, jsonToProxy = new Map): JSONType<C> => new Proxy(json, {
  get(target, property: string | number | symbol): unknown {
    const targetChild: unknown = Reflect.get(target, property);
    const constraintChild = constraint.getChildByProperty(property);

    if (constraintChild === null) {
      return targetChild;
    } else {
      try {
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
      } catch (e) {
        throw new JSONTypeError(`Types of property '${property.toString()}' are incompatible.`, [e]);
      }
    }
  }
});

export { $array, $boolean, $const, $false, $null, $number, $object, $string, $true, $undefined, $union } from "./Constraint";
export default wrap;
