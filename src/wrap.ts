import CheckerError, { CheckerError1, CheckerError2, ErrorWithChildren } from "./CheckerError";
import Constraint, { ArrayConstraint, BooleanConstraint, ConstantConstraint, NeverConstraint, NumberConstraint, ObjectConstraint, StringConstraint, UnionConstraint } from "./Constraint";

type Expected<C extends Constraint> =
  C extends NumberConstraint ? number :
  C extends StringConstraint ? string :
  C extends BooleanConstraint ? boolean :
  C extends ArrayConstraint<infer D> ? { 0: Expected<D>[] }[D extends D ? 0 : never] :
  C extends UnionConstraint<readonly (infer CS & Constraint)[]> ? (
    CS extends Constraint ? { 0: Expected<CS> }[C extends C ? 0 : never] :
    never) :
  C extends ObjectConstraint<infer D> ? { [P in (number | string) & keyof D]: Expected<D[P]> } :
  C extends ConstantConstraint<infer D> ? D :
  C extends NeverConstraint ? never :
  unknown;

const wrap = <C extends Constraint>(value: Expected<C> & object, constraint: C, { jsonToProxy, pathToRoot }: {
  readonly jsonToProxy: Map<unknown, unknown>,
  readonly pathToRoot: readonly {
    readonly property: string | number | symbol;
    readonly value: unknown;
    readonly constraint: Constraint;
  }[]
} = { jsonToProxy: new Map, pathToRoot: [] }): Expected<C> => new Proxy(value, {
  get(target, property: string | number | symbol): unknown {
    const targetChild: unknown = Reflect.get(target, property);
    const constraintChild = constraint.getChildByProperty(property);

    if (constraintChild === null) {
      return targetChild;
    } else {
      try {
        constraintChild.checkOnlySurface(targetChild);

        if (targetChild instanceof Object) {
          if (!jsonToProxy.has(targetChild)) {
            jsonToProxy.set(
              targetChild,
              wrap(
                targetChild, constraintChild,
                { jsonToProxy, pathToRoot: [{ property, value, constraint }, ...pathToRoot] }));
          }
          return jsonToProxy.get(targetChild)!;
        } else {
          return targetChild;
        }
      } catch (e) {
        e = new ErrorWithChildren(new CheckerError2(property), e);
        e = new ErrorWithChildren(new CheckerError1(value, constraint), e);
        for (const node of pathToRoot) {
          e = new ErrorWithChildren(new CheckerError2(node.property), e);
          e = new ErrorWithChildren(new CheckerError1(node.value, node.constraint), e);
        }
        e = new ErrorWithChildren(new CheckerError('Types of wrapped value are incompatible.'), e);
        throw e;
      }
    }
  }
});

export default wrap;