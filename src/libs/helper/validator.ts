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
  const nullErrors: string[] = [];

  for (const [field, ruleString] of Object.entries(rules)) {
    const rawParts = ruleString.split("|");
    const isNullable = rawParts.includes("nullable");
    const parts = rawParts.filter((r) => r !== "nullable" && r !== "");
    if (parts.length === 0) continue;

    const isRequired = parts.includes("required");
    const value = data[field];

    if (value === undefined) {
      if (!isRequired) continue;
    } else if (value === null) {
      if (isNullable) continue;
      nullErrors.push(`${field} must not be null`);
    }

    effectiveRules[field] = parts.join("|");
  }

  const validator = new Validator(data, effectiveRules);
  const messages: string[] = [...nullErrors];

  if (validator.fails()) {
    const errors = validator.errors.all();
    for (const key of Object.keys(errors)) {
      for (const msg of errors[key]) {
        messages.push(msg as unknown as string);
      }
    }
  }

  if (messages.length) {
    return { passed: false, errors: messages };
  }

  return { passed: true, errors: [] };
}
