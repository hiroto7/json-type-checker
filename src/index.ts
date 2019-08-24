import { AnyNumber, AnyString, ArrayConstraint, UnionConstraint, AnyBoolean } from "./Constraint";

type JSONType<Constraint> =
  Constraint extends AnyNumber ? number :
  Constraint extends AnyString ? string :
  Constraint extends AnyBoolean ? boolean :
  Constraint extends ArrayConstraint<infer T> ? { 0: JSONType<T>[] }[Constraint extends Constraint ? 0 : never] :
  Constraint extends UnionConstraint<infer T1, infer T2> ? { 0: JSONType<T1> | JSONType<T2> }[Constraint extends Constraint ? 0 : never] :
  Constraint extends object ? { [P in keyof Constraint]: JSONType<Constraint[P]> } :
  Constraint;

const wrap = <Constraint extends object>(json: JSONType<Constraint>, constraint: Constraint): JSONType<Constraint> => new Proxy(json, {
  get(target, property: keyof Constraint) {

    if (constraint[property] instanceof AnyNumber) {
      if (typeof Reflect.get(target, property) !== 'number') { throw new TypeError(`(...).${property} is not a number`); }
    }

    else if (constraint[property] instanceof AnyString) {
      if (typeof Reflect.get(target, property) !== 'string') { throw new TypeError(`(...).${property} is not a string`); }
    }

    else if (constraint[property] instanceof AnyBoolean) {
      if (typeof Reflect.get(target, property) !== 'boolean') { throw new TypeError(`(...).${property} is not a string`); }
    }

    else if (
      typeof constraint[property] === 'number' || typeof constraint[property] === 'string' || typeof constraint[property] === 'boolean' ||
      constraint[property] === null || constraint[property] === undefined) {
      if (Reflect.get(target, property) !== constraint[property]) { throw new TypeError(`(...).${property} is not value '${constraint[property]}'`); }
    }

    return Reflect.get(target, property);
  }
});

export { anyNumber, anyString, anyBoolean, ArrayConstraint, UnionConstraint } from "./Constraint";
export default wrap;
