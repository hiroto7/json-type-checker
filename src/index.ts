import { AnyBoolean, AnyNumber, AnyString, ArrayConstraint, Union } from "./Constraint";
import prettyFormat from 'pretty-format';
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
  Constraint extends object ? { [P in keyof Constraint]: JSONType<Constraint[P]> } :
  Constraint;

const valueIsNotType = (value: unknown, constraint: unknown): string =>
  `${prettyFormat(value, { min: true })} is not type '${getTypeName(constraint)}'.`

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
  } else {
    if (value !== constraint) { throw new JSONTypeError(valueIsNotType(value, constraint)); }
  }
}

const wrap = <Constraint extends object>(json: JSONType<Constraint>, constraint: Constraint): JSONType<Constraint> => {
  const children: { [P in keyof Constraint]?: JSONType<Constraint[P]> } = {};

  return new Proxy(json, {
    get(target, property: keyof Constraint) {

      if (Reflect.get(target, property) instanceof Object) {

        if (!(constraint[property] instanceof Object) || constraint[property] instanceof AnyNumber ||
          constraint[property] instanceof AnyString || constraint[property] instanceof AnyBoolean) {
          throw new JSONTypeError(`(...).${property} is not a object`);
        }

        if (!(property in children)) {
          children[property] = wrap(
            Reflect.get(target, property),
            constraint[property] as object & Constraint[keyof Constraint]);
        }
        return children[property];

      } else {
        check1(Reflect.get(target, property), constraint[property]);
        return Reflect.get(target, property);
      }

    }
  })
};

export { anyBoolean, anyNumber, anyString, arrayConstraint, union } from "./Constraint";
export default wrap;
