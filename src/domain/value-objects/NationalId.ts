/**
 * Numéro d'identification national gabonais (format MVP).
 * Format : GA-YYYY-NNNNNN
 *   - GA = code pays
 *   - YYYY = année de génération
 *   - NNNNNN = 6 chiffres
 */
const PATTERN = /^GA-\d{4}-\d{6}$/;

export class NationalId {
  constructor(public readonly value: string) {
    if (!PATTERN.test(value)) {
      throw new Error(
        `Numéro d'identification invalide. Format attendu : GA-YYYY-NNNNNN`
      );
    }
  }

  static isValid(value: string): boolean {
    return PATTERN.test(value);
  }

  static generate(): string {
    const year = new Date().getFullYear();
    const n = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');
    return `GA-${year}-${n}`;
  }
}
