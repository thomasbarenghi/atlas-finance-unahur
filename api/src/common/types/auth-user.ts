export interface AuthUser {
  id: string;
  email: string;
  sessionId: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  sid: string;
}
