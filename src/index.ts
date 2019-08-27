import prettyFormat from 'pretty-format';
import Constraint, { $never, $union, ArrayConstraint, BooleanConstraint, ConstantConstraint, NeverConstraint, NumberConstraint, ObjectConstraint, StringConstraint, UnionConstraint } from "./Constraint";

export class JSONTypeError implements Error {
  name: string = 'JSONTypeError';
  message: string;
  stack?: string | undefined;
  constructor(message?: string) { this.message = message || '' }
}

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

const valueIsNotType = (value: unknown, constraint: Constraint): string =>
  `Value '${prettyFormat(value, { min: true })}' is not type '${constraint.typeName}'.`

const check1 = (value: unknown, constraint: Constraint): void => {
  if (constraint instanceof UnionConstraint) {
    const errors: Set<string> = new Set;
    for (const child of constraint.children()) {
      try {
        check1(value, child);
      } catch (e) {
        errors.add(e.message);
        continue;
      }
      return;
    }
    throw new JSONTypeError([valueIsNotType(value, constraint), ...errors].join('\n'));
  } else if (constraint instanceof BooleanConstraint || constraint instanceof NumberConstraint || constraint instanceof StringConstraint) {
    if (typeof value !== constraint.typeName) { throw new JSONTypeError(valueIsNotType(value, constraint)); }
  } else if (constraint instanceof ObjectConstraint) {
    if (!(value instanceof Object)) { throw new JSONTypeError(valueIsNotType(value, constraint)); }
  } else if (constraint instanceof ConstantConstraint) {
    if (value !== constraint.value) { throw new JSONTypeError(valueIsNotType(value, constraint)); }
  } else {
    throw new Error('Not implemented');
  }
}

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
        check1(targetChild, constraintChild);

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
      throw new JSONTypeError(`Types of property '${property}' are incompatible.` + '\n' + e.message);
    }
  }
});

export { $array, $boolean, $const, $false, $null, $number, $object, $string, $true, $undefined, $union } from "./Constraint";
export default wrap;
