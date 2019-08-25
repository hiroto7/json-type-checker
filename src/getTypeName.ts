import Constraint from "./Constraint";

const getTypeName = (obj: unknown): string => {
  if (Constraint.isConstraint(obj)) {
    return obj.typeName;
  } else if (Array.isArray(obj)) {
    return `[${obj.map(value => getTypeName(value)).join(', ')}]`
  } else if (obj instanceof Object) {
    return Object.keys(obj).length === 0 ?
      '{}' :
      `{ ${
      Object.entries(obj).map(([key, value]) => `"${key}": ${getTypeName(value)};`).join(' ')
      } }`;
  } else if (typeof obj === 'string') {
    return `"${obj}"`
  } else {
    return `${obj}`;
  }
}

export default getTypeName;