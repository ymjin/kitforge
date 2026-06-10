/**
 * Secure token storage abstraction.
 *
 * The default uses `expo-secure-store` (Keychain on iOS, Keystore on Android),
 * loaded lazily so this module imports cleanly without Expo present (and so
 * tests can inject a mock). Bring your own by implementing `SecureStorage`.
 */

export interface SecureStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

async function loadSecureStore(): Promise<typeof import("expo-secure-store")> {
  try {
    return await import("expo-secure-store");
  } catch {
    throw new Error(
      "[@kitforge/auth] The default native storage needs 'expo-secure-store'. " +
        "Install it, or pass your own `storage` to <KitforgeAuthProvider>.",
    );
  }
}

/** Default storage backed by expo-secure-store. */
export const expoSecureStorage: SecureStorage = {
  async getItem(key) {
    const store = await loadSecureStore();
    return store.getItemAsync(key);
  },
  async setItem(key, value) {
    const store = await loadSecureStore();
    await store.setItemAsync(key, value);
  },
  async removeItem(key) {
    const store = await loadSecureStore();
    await store.deleteItemAsync(key);
  },
};
