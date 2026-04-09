/**
 * Thin wrapper around localStorage with JSON serialization and a namespace prefix.
 * This is the ONLY place in the codebase that talks directly to window.localStorage.
 */
const NAMESPACE = 'sgcj_gabon_mvp';

export class LocalStorageAdapter {
  private key(k: string): string {
    return `${NAMESPACE}:${k}`;
  }

  get<T>(k: string): T | null {
    try {
      const raw = window.localStorage.getItem(this.key(k));
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  set<T>(k: string, value: T): void {
    window.localStorage.setItem(this.key(k), JSON.stringify(value));
  }

  remove(k: string): void {
    window.localStorage.removeItem(this.key(k));
  }

  clearAll(): void {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(NAMESPACE + ':')) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  }
}

export const storage = new LocalStorageAdapter();
