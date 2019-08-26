import prettyFormat from 'pretty-format';
import { AnyBoolean, AnyNumber, AnyString, ArrayConstraint, NeverConstraint, neverConstraint, Union, union } from "./Constraint";
import getTypeName from "./getTypeName";

export class JSONTypeError implements Error {
  name: string = 'JSONTypeError';
  message: string;
  stack?: string | undefined;
  constructor(message?: string) { this.message = message || '' }
}

type JSONType<Constraint> =
  Constraint extends AnyNumber ? number :
  Constraint extends AnyString ? string :
  Constraint extends AnyBoolean ? boolean :
  Constraint extends ArrayConstraint<infer C> ? { 0: JSONType<C>[] }[Constraint extends Constraint ? 0 : never] :
  Constraint extends Union<readonly (infer CS)[]> ? { 0: JSONType<CS> }[Constraint extends Constraint ? 0 : never] :
  Constraint extends object ? { [P in (number | string) & keyof Constraint]: JSONType<Constraint[P]> } :
  Constraint;

const valueIsNotType = (value: unknown, constraint: unknown): string =>
  `Value '${prettyFormat(value, { min: true })}' is not type '${getTypeName(constraint)}'.`

const check1 = (value: unknown, constraint: unknown): void => {
  if (constraint instanceof Union) {
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
  } else if (constraint instanceof AnyBoolean || constraint instanceof AnyNumber || constraint instanceof AnyString) {
    if (typeof value !== constraint.typeName) { throw new JSONTypeError(valueIsNotType(value, constraint)); }
  } else if (constraint instanceof Object) {
    if (!(value instanceof Object)) { throw new JSONTypeError(valueIsNotType(value, constraint)); }
  } else {
    if (value !== constraint) { throw new JSONTypeError(valueIsNotType(value, constraint)); }
  }
}

const getConstraintChild =
  (constraint: unknown, property: string | number): { isValid: true, constraint: unknown } | { isValid: false, constraint: null } => {
    if (constraint instanceof Union) {
      const childChildren = new Set;
      for (const child of constraint.children()) {
        const { constraint: childChild, isValid: childChildIsValid } = getConstraintChild(child, property);
        if (!childChildIsValid) { return { isValid: false, constraint: null }; }
        if (!(childChild instanceof NeverConstraint)) {
          childChildren.add(childChild);
        }
      }
      return { isValid: true, constraint: union(...childChildren) };
    } else {
      if (!(constraint instanceof Object)) {
        return { isValid: true, constraint: neverConstraint };
      } else if (!(property in constraint)) {
        return { isValid: false, constraint: null };
      } else {
        return { isValid: true, constraint: (constraint as { [key: string]: unknown })[property] };
      }
    }
  }

const wrap = <Constraint extends object>(json: JSONType<Constraint>, constraint: Constraint, jsonToProxy = new Map): JSONType<Constraint> => new Proxy(json, {
  get(target, property: (number | string) & keyof Constraint) {
    const targetChild = Reflect.get(target, property);
    const { constraint: constraintChild, isValid: constraintChildIsValid } = getConstraintChild(constraint, property);

    try {
      if (!constraintChildIsValid) {
        return targetChild;
      } else {
        check1(targetChild, constraintChild);

        if (targetChild instanceof Object) {
          if (!jsonToProxy.has(targetChild)) {
            jsonToProxy.set(
              targetChild,
              wrap(
                targetChild,
                constraintChild as object & Constraint[(number | string) & keyof Constraint],
                jsonToProxy));
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

export { anyBoolean, anyNumber, anyString, arrayConstraint, union } from "./Constraint";
export default wrap;
