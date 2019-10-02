import { CheckerError1, CheckerError2, ErrorWithChildren } from "./CheckerError";
import Constraint from "./Constraint";
import ExpectedType from "./ExpectedType";

const wrap = <C extends Constraint>(value: ExpectedType<C> & object, constraint: C, { jsonToProxy, pathToRoot }: {
  readonly jsonToProxy: Map<unknown, unknown>,
  readonly pathToRoot: readonly {
    readonly property: string | number | symbol;
    readonly value: unknown;
    readonly constraint: Constraint;
  }[]
} = { jsonToProxy: new Map, pathToRoot: [] }): ExpectedType<C> => new Proxy(value, {
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
        throw e;
      }
    }
  }
});

export default wrap;