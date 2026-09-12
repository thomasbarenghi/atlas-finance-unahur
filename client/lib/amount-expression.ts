const OPERATOR_MAP: Record<string, string> = {
  "+": "+",
  "-": "-",
  "−": "-",
  "×": "*",
  "÷": "/",
};

export const AMOUNT_OPERATORS = ["+", "−", "×", "÷"] as const;

const tokenize = (input: string): string[] | null => {
  const tokens = input
    .replace(/,/g, ".")
    .match(/(\d+(?:\.\d*)?|\.\d+)|[+\-−×÷]/g);
  if (!tokens || tokens.length === 0) return null;

  const normalized: string[] = [];
  let expectNumber = true;
  for (const token of tokens) {
    if (/^[\d.]+$/.test(token)) {
      if (!expectNumber) return null;
      normalized.push(token);
      expectNumber = false;
    } else {
      if (expectNumber) return null;
      normalized.push(OPERATOR_MAP[token]);
      expectNumber = true;
    }
  }
  if (expectNumber) return null;
  return normalized;
};

export const evaluateAmountExpression = (input: string): number | null => {
  const tokens = tokenize(input);
  if (!tokens) return null;

  const values: number[] = [];
  const operators: string[] = [];
  for (const token of tokens) {
    if (/^[\d.]+$/.test(token)) values.push(Number(token));
    else operators.push(token);
  }

  const reducedValues = [values[0]];
  const additiveOperators: string[] = [];
  for (let index = 0; index < operators.length; index += 1) {
    const operator = operators[index];
    const next = values[index + 1];
    if (operator === "*") {
      reducedValues[reducedValues.length - 1] *= next;
    } else if (operator === "/") {
      reducedValues[reducedValues.length - 1] =
        next === 0
          ? Number.NaN
          : reducedValues[reducedValues.length - 1] / next;
    } else {
      additiveOperators.push(operator);
      reducedValues.push(next);
    }
  }

  let result = reducedValues[0];
  for (let index = 0; index < additiveOperators.length; index += 1) {
    const next = reducedValues[index + 1];
    result = additiveOperators[index] === "+" ? result + next : result - next;
  }

  return Number.isFinite(result) ? Math.round(result * 100) / 100 : null;
};
