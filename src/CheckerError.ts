import Constraint from './Constraint';
import prettyFormat from 'pretty-format';

const isError = (obj: unknown): obj is Error => obj instanceof Object && 'name' in obj && 'message' in obj;

export default class CheckerError implements Error {
  private _message: string;
  name = 'CheckerError';
  stack?: string | undefined;
  get message(): string { return this._message; }
  constructor(message: string = '') { this._message = message; }
}

export class ErrorWithChildren extends CheckerError {
  private _children: Iterable<unknown>;
  get message(): string { return this.getIndentedMessage(0, 2); }

  constructor(readonly main: unknown, ...children: readonly unknown[]) {
    super();
    this._children = children;
  }

  private static _computeSpace(space: string | number): string {
    return typeof space === 'string' ? space : ' '.repeat(space);
  }

  *children() { yield* this._children; }

  getIndentedMessage(space0: string | number, space1: string | number): string {
    const computedSpace0: string = ErrorWithChildren._computeSpace(space0);
    const computedSpace1: string = ErrorWithChildren._computeSpace(space1);

    const firstLine: string = computedSpace0 + (isError(this.main) ? this.main.message : this.main);
    const remainingLines: string[] = [...this.children()].map(child =>
      child instanceof ErrorWithChildren ?
        child.getIndentedMessage(computedSpace0 + computedSpace1, computedSpace1) :
        computedSpace0 + computedSpace1 + (isError(child) ? child.message : child));

    return firstLine + '\n' + remainingLines.join('\n');
  }
}

export class CheckerError1 extends CheckerError {
  get message(): string {
    return `Value '${prettyFormat(this.value, { min: true, maxDepth: 1 })}' is not type '${this.constraint.typeName}'.`;
  }
  constructor(readonly value: unknown, readonly constraint: Constraint) { super(); }
}

export class CheckerError2 extends CheckerError {
  get message(): string {
    return `Types of property '${this.property.toString()}' are incompatible.`;
  }
  constructor(readonly property: string | number | symbol) { super(); }
}
