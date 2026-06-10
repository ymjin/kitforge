/**
 * Minimal ambient declarations for the Expo auth packages this entry uses, so
 * `@kitforge/auth/native` type-checks and emits declarations without taking a
 * hard dependency on the Expo toolchain. The consumer installs the real
 * packages; these only cover the surface we touch.
 */

declare module "expo-secure-store" {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function deleteItemAsync(key: string): Promise<void>;
}

declare module "expo-auth-session" {
  export interface DiscoveryDocument {
    authorizationEndpoint: string;
    tokenEndpoint: string;
  }
  export interface AuthRequestConfig {
    clientId: string;
    scopes?: string[];
    redirectUri: string;
    responseType?: string;
    usePKCE?: boolean;
    extraParams?: Record<string, string>;
  }
  export interface AuthRequest {
    codeVerifier?: string;
  }
  export interface AuthSessionResult {
    type: "success" | "cancel" | "dismiss" | "error" | "locked";
    params: Record<string, string>;
    error?: { message?: string } | null;
  }
  export interface TokenResponse {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    tokenType?: string;
    expiresIn?: number;
    scope?: string;
    issuedAt?: number;
  }
  export function useAuthRequest(
    config: AuthRequestConfig,
    discovery: DiscoveryDocument | null,
  ): [AuthRequest | null, AuthSessionResult | null, () => Promise<AuthSessionResult>];
  export function exchangeCodeAsync(
    config: {
      clientId: string;
      code: string;
      redirectUri: string;
      extraParams?: Record<string, string>;
    },
    discovery: DiscoveryDocument,
  ): Promise<TokenResponse>;
  export function makeRedirectUri(options?: { scheme?: string; path?: string }): string;
}

declare module "expo-web-browser" {
  export function maybeCompleteAuthSession(): void;
}
