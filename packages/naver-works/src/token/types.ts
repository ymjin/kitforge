export interface StoredToken {
  accessToken: string;
  refreshToken?: string | null;
  idToken?: string | null;
  expiresAt: string; // ISO 8601
}

export interface StoredSAToken {
  token: string;
  expiresAt: string; // ISO 8601
}

/**
 * 소비자 앱이 구현해서 주입하는 토큰 저장소 인터페이스.
 * 저장 위치(Supabase, NeonDB, Redis 등)는 앱이 결정한다.
 */
export interface NaverWorksTokenAdapter {
  /** 유저 OAuth 토큰 조회 */
  getToken(userId: string): Promise<StoredToken | null>;
  /** 유저 OAuth 토큰 저장/갱신 */
  saveToken(userId: string, token: StoredToken): Promise<void>;
  /** 유저 OAuth 토큰 삭제 (로그아웃) */
  clearToken(userId: string): Promise<void>;
  /** 서비스 계정 토큰 캐시 조회 (선택) */
  getSAToken?(): Promise<StoredSAToken | null>;
  /** 서비스 계정 토큰 캐시 저장 (선택) */
  saveSAToken?(token: string, expiresAt: string): Promise<void>;
}

export interface NaverWorksConfig {
  clientId: string;
  clientSecret: string;
  /** 서비스 계정 인증 (봇·드라이브 관리자 작업용, 선택) */
  serviceAccount?: {
    id: string;
    privateKey: string; // PEM (\\n 이스케이프 허용)
    /** 쉼표 구분 스코프 목록, 기본: "bot,calendar,directory.read,user.read" */
    scopes?: string;
  };
}
