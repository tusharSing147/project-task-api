import Validator from "validatorjs";

export interface ValidationResult {
  passed: boolean;
  errors: string[];
}

export function validate(
  data: Record<string, unknown>,
  rules: Record<string, string>,
): ValidationResult {
  const effectiveRules: Record<string, string> = {};

  for (const [field, ruleString] of Object.entries(rules)) {
    const parts = ruleString
      .split("|")
      .filter((r) => r !== "nullable" && r !== "");
    if (parts.length === 0) continue;

    const isRequired = parts.includes("required");
    const value = data[field];

    if (!isRequired && (value === undefined || value === null)) {
      continue;
    }

    effectiveRules[field] = parts.join("|");
  }

  const validator = new Validator(data, effectiveRules);

  if (validator.fails()) {
    const errors = validator.errors.all();
    const messages: string[] = [];
    for (const key of Object.keys(errors)) {
      for (const msg of errors[key]) {
        messages.push(msg as unknown as string);
      }
    }
    return { passed: false, errors: messages };
  }

  return { passed: true, errors: [] };
}
