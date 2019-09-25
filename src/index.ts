import Constraint, { ArrayConstraint, BooleanConstraint, ConstantConstraint, NeverConstraint, NumberConstraint, ObjectConstraint, StringConstraint, UnionConstraint } from "./Constraint";
import { CheckerError1, CheckerError2, ErrorWithChildren } from './JSONTypeError';

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

type PathToRootInit = {
  readonly property: string | number | symbol;
  readonly value: unknown;
  readonly constraint: Constraint;
  readonly parent: PathToRoot | null;
}

class PathToRoot implements PathToRootInit {
  readonly property: string | number | symbol;
  readonly value: unknown;
  readonly constraint: Constraint;
  readonly parent: PathToRoot | null;
  constructor({ property, value, constraint, parent }: PathToRootInit) {
    this.property = property;
    this.value = value;
    this.constraint = constraint;
    this.parent = parent;
  }
  *[Symbol.iterator](): Generator<PathToRoot, void, unknown> {
    yield this;
    if (this.parent !== null) { yield* this.parent; }
  }
}

const wrap = <C extends Constraint>(value: JSONType<C> & object, constraint: C, jsonToProxy = new Map, pathToRoot: PathToRoot | null = null): JSONType<C> => new Proxy(value, {
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
              wrap(
                targetChild, constraintChild, jsonToProxy,
                new PathToRoot({ property, value, constraint, parent: pathToRoot })));
          }
          return jsonToProxy.get(targetChild)!;
        } else {
          return targetChild;
        }
      } catch (e) {
        e = new ErrorWithChildren(new CheckerError2(property), e);
        e = new ErrorWithChildren(new CheckerError1(value, constraint), e);
        if (pathToRoot !== null) {
          for (const path of pathToRoot) {
            e = new ErrorWithChildren(new CheckerError2(path.property), e);
            e = new ErrorWithChildren(new CheckerError1(path.value, path.constraint), e);
          }
        }
        throw e;
      }
    }
  }
});

export { $array, $boolean, $const, $false, $null, $number, $object, $string, $true, $undefined, $union } from "./Constraint";
export default wrap;
