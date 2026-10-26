import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { httpClient } from "./test-app";

export interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
  accessToken: string;
  refreshToken: string;
}

let counter = 0;

export const uniqueEmail = (prefix = "user"): string =>
  `${prefix}.${Date.now()}.${counter++}@test.local`;

const readCookie = (headers: Record<string, unknown>, name: string): string => {
  const cookies = headers["set-cookie"] as unknown as string[] | undefined;
  const header = cookies?.find((cookie) => cookie.startsWith(`${name}=`));
  return header?.split(";")[0]?.slice(name.length + 1) ?? "";
};

/** Web-only suite: authentication always travels through the access cookie. */
export const authCookie = (token: string): Record<string, string> => ({
  Cookie: `access_token=${token}`,
});

export const refreshCookie = (token: string): Record<string, string> => ({
  Cookie: `refresh_token=${token}`,
});

/**
 * Registers a user through the public API and returns the token values parsed
 * from the HttpOnly cookies (login is automatic after registration).
 */
export const registerUser = async (
  app: INestApplication,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
): Promise<TestUser> => {
  const payload = {
    name: "Test User",
    email: uniqueEmail(),
    password: "Secreta123",
    ...overrides,
  };
  const response = await request(httpClient(app))
    .post("/api/auth/register")
    .send(payload)
    .expect(201);

  return {
    id: response.body.user.id,
    email: payload.email,
    name: payload.name,
    password: payload.password,
    accessToken: readCookie(response.headers, "access_token"),
    refreshToken: readCookie(response.headers, "refresh_token"),
  };
};

export const loginUser = async (
  app: INestApplication,
  email: string,
  password: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
}> => {
  const response = await request(httpClient(app))
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return {
    accessToken: readCookie(response.headers, "access_token"),
    refreshToken: readCookie(response.headers, "refresh_token"),
    user: response.body.user,
  };
};
