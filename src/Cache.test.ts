import { expect, test } from "vitest";

type Key =
  | undefined
  | null
  | boolean
  | number
  | bigint
  | string
  | symbol
  | Key[]
  | { [key: number | string | symbol]: Key };

test("Matches keys correctly", () => {
  const matchKeys = (
    sourceKey: Key,
    targetKey: Key,
    isExact: boolean = true
  ): boolean => {
    if (sourceKey === targetKey) {
      return true;
    }

    if (
      typeof sourceKey === "object" &&
      sourceKey !== null &&
      typeof targetKey === "object" &&
      targetKey !== null
    ) {
      const sourceKeyKeys = Object.keys(sourceKey);
      const targetKeyKeys = Object.keys(targetKey);

      if (!isExact || sourceKeyKeys.length === targetKeyKeys.length) {
        return (isExact ? sourceKeyKeys : targetKeyKeys).every((key) =>
          matchKeys(
            Array.isArray(sourceKey) ? sourceKey[Number(key)] : sourceKey[key],
            Array.isArray(targetKey) ? targetKey[Number(key)] : targetKey[key]
          )
        );
      }
    }

    return false;
  };

  const s1 = Symbol("s1");
  const s2 = Symbol("s1");

  expect(matchKeys({ s2: 123 }, { s2: 123 }, false)).toBeTruthy();
});
