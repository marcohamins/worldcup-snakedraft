import fs from "fs";
import path from "path";

const GROUP_LETTERS = "ABCDEFGHIJKL".split("");

interface BracketMatrix {
  structure: {
    thirdSlotEligible: string[][];
  };
  combinations: Record<string, string[]>;
}

function groupCombinations(n: number, k: number): string[][] {
  const result: string[][] = [];

  function backtrack(start: number, combo: string[]) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < n; i += 1) {
      combo.push(GROUP_LETTERS[i]);
      backtrack(i + 1, combo);
      combo.pop();
    }
  }

  backtrack(0, []);
  return result;
}

function main(): void {
  const filePath = path.join(process.cwd(), "data/bracket-matrix.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as BracketMatrix;
  const thirdSlotEligible = data.structure.thirdSlotEligible;
  const combinationMap = data.combinations;

  let failures = 0;
  for (const combo of groupCombinations(12, 8)) {
    const key = combo.join("");
    const assignment = combinationMap[key];
    if (!assignment || assignment.length !== 8) {
      failures += 1;
      continue;
    }

    const used = new Set(assignment);
    if (used.size !== 8) {
      failures += 1;
      continue;
    }

    for (let slot = 0; slot < 8; slot += 1) {
      const group = assignment[slot];
      if (!combo.includes(group)) {
        failures += 1;
        break;
      }
      if (!thirdSlotEligible[slot].includes(group)) {
        failures += 1;
        break;
      }
    }
  }

  if (failures > 0) {
    console.error(`Bracket matrix validation failed: ${failures} issues`);
    process.exit(1);
  }

  console.log(
    `Validated ${Object.keys(combinationMap).length} bracket combinations`,
  );
}

main();
