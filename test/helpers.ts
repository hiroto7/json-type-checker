import Constraint, { $array, $boolean, $number, $object, $union } from "../src/Constraint";

export const table0: Constraint[] = [
  $object({ a: $number }),
  $object({ a: $union($boolean, $number) }),
  $union($object({ a: $boolean }), $object({ a: $number })),
];
export const constraint1 = $object({ a: $object({ b: $number }) });
export const table2: Constraint[] = [
  $array($number),
  $array($union($boolean, $number)),
  $union($array($boolean), $array($number)),
];
