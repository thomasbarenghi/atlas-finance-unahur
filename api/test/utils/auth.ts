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

export const bearer = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
});

/**
 * Registers a user through the public API and returns its tokens (login is
 * performed via `POST /auth/register`, which signs the user in).
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
    accessToken: response.body.accessToken,
    refreshToken: response.body.refreshToken,
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
    accessToken: response.body.accessToken,
    refreshToken: response.body.refreshToken,
    user: response.body.user,
  };
};
