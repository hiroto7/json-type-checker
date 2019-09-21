import Constraint from './Constraint';
import prettyFormat from 'pretty-format';

const isError = (obj: unknown): obj is Error => obj instanceof Object && 'name' in obj && 'message' in obj;

export default class JSONTypeError implements Error {
  private _message: string;
  name: string = 'JSONTypeError';
  stack?: string | undefined;
  children: readonly unknown[];
  get message(): string {
    return [this._message, ...this.children.map(child => isError(child) ? child.message : child)].join('\n');
  }
  constructor(message: string = '', children: Iterable<unknown> = []) {
    this._message = message;
    this.children = [...children];
  }
}

export const jsonTypeError1 = (value: unknown, constraint: Constraint, children: Iterable<unknown> = []): JSONTypeError =>
  new JSONTypeError(
    `Value '${prettyFormat(value, { min: true, maxDepth: 1 })}' is not type '${constraint.typeName}'.`,
    children);

export const jsonTypeError2 = (property: string | number | symbol, children: Iterable<unknown> = []): JSONTypeError =>
  new JSONTypeError(
    `Types of property '${property.toString()}' are incompatible.`,
    children);
