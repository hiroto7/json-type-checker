import { AnyBoolean, AnyNumber, AnyString, ArrayConstraint, Union } from "./Constraint";

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

const wrap = <Constraint extends object>(json: JSONType<Constraint>, constraint: Constraint): JSONType<Constraint> => {
  const children: { [P in keyof Constraint]?: JSONType<Constraint[P]> } = {};

  return new Proxy(json, {
    get(target, property: keyof Constraint) {

      if (constraint[property] instanceof AnyNumber) {
        if (typeof Reflect.get(target, property) !== 'number') { throw new JSONTypeError(`(...).${property} is not a number`); }
        return Reflect.get(target, property);
      }

      else if (constraint[property] instanceof AnyString) {
        if (typeof Reflect.get(target, property) !== 'string') { throw new JSONTypeError(`(...).${property} is not a string`); }
        return Reflect.get(target, property);
      }

      else if (constraint[property] instanceof AnyBoolean) {
        if (typeof Reflect.get(target, property) !== 'boolean') { throw new JSONTypeError(`(...).${property} is not a boolean`); }
        return Reflect.get(target, property);
      }

      else if (constraint[property] instanceof ArrayConstraint) { throw new Error('Not implemented'); }
      else if (constraint[property] instanceof UnionConstraint) { throw new Error('Not implemented'); }

      else if (
        typeof constraint[property] === 'number' || typeof constraint[property] === 'string' || typeof constraint[property] === 'boolean' ||
        constraint[property] === null || constraint[property] === undefined) {
        if (Reflect.get(target, property) !== constraint[property]) { throw new JSONTypeError(`(...).${property} is not value '${constraint[property]}'`); }
        return Reflect.get(target, property);
      }

      else if (constraint[property] instanceof Object) {
        if (!(Reflect.get(target, property) instanceof Object)) { throw new JSONTypeError(`(...).${property} is not a object`); }
        if (!(property in children)) {
          children[property] = wrap(
            Reflect.get(target, property),
            constraint[property] as object & Constraint[keyof Constraint]);
        }
        return children[property];
      }

    }
  })
};

export { anyBoolean, anyNumber, anyString, arrayConstraint, union } from "./Constraint";
export default wrap;
