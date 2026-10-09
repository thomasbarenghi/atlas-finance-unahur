/**
 * Guard contra "propuestas fantasma": el modelo puede narrar que dejó una acción
 * pendiente/lista para confirmar sin haber llamado a su herramienta, con lo que
 * el usuario vería una promesa de tarjeta que no existe. Este módulo detecta esa
 * inconsistencia comparando el texto de la respuesta con las tools efectivamente
 * propuestas (de este turno y pendientes de la conversación).
 *
 * El texto se normaliza (sin acentos) antes de comparar: en JavaScript `\b` no
 * reconoce letras acentuadas como caracteres de palabra, por lo que evaluar
 * patrones con acentos rompería los límites de palabra.
 */

/** Tool de escritura → claves de acción que cubre en el texto. */
export const ACTION_CLAIM_TOOL_KEYS: Record<string, string[]> = {
  createAccount: ["account"],
  updateAccount: ["account"],
  archiveAccount: ["account"],
  restoreAccount: ["account"],
  createCategory: ["category"],
  updateCategory: ["category"],
  archiveCategory: ["category"],
  createTransaction: ["transaction"],
  updateTransaction: ["transaction"],
  deleteTransaction: ["transaction"],
  transferBetweenAccounts: ["transfer"],
  createBudget: ["budget"],
  updateBudget: ["budget"],
  deleteBudget: ["budget"],
  copyPreviousBudgets: ["budget"],
  createAsset: ["asset"],
  updateAsset: ["asset"],
  archiveAsset: ["asset"],
  createValuation: ["valuation"],
  createDebt: ["debt"],
  updateDebt: ["debt"],
  archiveDebt: ["debt"],
  createPosition: ["position"],
  updatePosition: ["position"],
  deletePosition: ["position"],
  archivePosition: ["position"],
  restorePosition: ["position"],
  addToPosition: ["position"],
  createGoal: ["goal"],
  updateGoal: ["goal"],
  archiveGoal: ["goal"],
  restoreGoal: ["goal"],
  contributeToGoal: ["goal"],
  updatePreferences: ["preferences"],
};

const ACTION_KEY_PATTERNS: Array<[string, RegExp]> = [
  ["account", /\bcuentas?\b/],
  ["category", /\bcategorias?\b/],
  ["transaction", /\b(?:gastos?|ingresos?|movimientos?)\b/],
  ["transfer", /\btransferencias?\b|\btransferir\b|\btransferi\b/],
  ["budget", /\bpresupuestos?\b/],
  ["asset", /\bactivos?\b/],
  ["valuation", /\bvaluacion(?:es)?\b/],
  [
    "position",
    /\binversion(?:es)?\b|\bposicion(?:es)?\b|\bcompras?\b|\bcomprar\b|\baport(?:e|ar|es)\b/,
  ],
  ["goal", /\bmetas?\b|\bobjetivos?\b/],
  ["preferences", /\bpreferencias?\b|\btema\b/],
];

/**
 * Frases que afirman que una acción quedó propuesta/pendiente/lista para
 * confirmar. Deliberadamente específicas para no disparar ante explicaciones
 * generales sobre la confirmación.
 */
const PROPOSAL_PROMISE =
  /(?:\bte\s+)?(?:propuse|propongo|deje|dejo)\b|\bquedara\s+(?:pendiente|lista|disponible)\b|\bquedo\s+pendiente\b|\bpara\s+que\s+(?:la|lo|las|los)\s+confirm\w*|\bconfirma\s+(?:la|lo|las|los|ambas|ambos|cada|el|esa|ese)\b/;

/** Niega el compromiso (p. ej. "no te propuse ninguna transferencia"). */
const NEGATED_PROMISE =
  /\b(?:no|nunca|jamas|tampoco)\s+(?:\w+\s+){0,3}(?:te\s+)?(?:propuse|propongo|deje|dejo|quedo|queda|quedara)\b/;

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const splitSentences = (answer: string): string[] =>
  normalize(answer)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

/**
 * Devuelve `true` si la respuesta afirma una acción que no figura entre las
 * tools propuestas (ni en este turno ni como pendientes vigentes).
 */
export const claimsUnproposedAction = (
  answer: string,
  proposedToolNames: Iterable<string>,
): boolean => {
  if (!answer.trim()) return false;

  const proposedKeys = new Set<string>();
  for (const name of proposedToolNames) {
    for (const key of ACTION_CLAIM_TOOL_KEYS[name] ?? []) {
      proposedKeys.add(key);
    }
  }

  const claimed = new Set<string>();
  for (const sentence of splitSentences(answer)) {
    if (!PROPOSAL_PROMISE.test(sentence)) continue;
    if (NEGATED_PROMISE.test(sentence)) continue;
    for (const [key, pattern] of ACTION_KEY_PATTERNS) {
      if (pattern.test(sentence)) claimed.add(key);
    }
  }

  for (const key of claimed) {
    if (!proposedKeys.has(key)) return true;
  }
  return false;
};
