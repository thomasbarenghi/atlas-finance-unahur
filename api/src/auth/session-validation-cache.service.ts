import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthUser } from "../common/types/auth-user";
import { AppConfig } from "../config/configuration";

interface CacheEntry {
  user: AuthUser;
  expiresAt: number;
}

/** Max entries kept per instance; protects against unbounded growth. */
const MAX_ENTRIES = 10_000;

/**
 * Short-lived in-memory cache for validated sessions.
 *
 * The JWT guard validates the session against the database on every request.
 * With a remote database that is one extra round-trip (~100–200 ms) per call,
 * paid before the controller runs. Caching the successful validation for a few
 * seconds removes that cost from bursts of requests (e.g. dashboard + accounts)
 * while keeping revocation delay bounded by the TTL. `logout` invalidates the
 * entry immediately on the instance that handles it.
 *
 * Concurrent validations of the same session are coalesced into a single query
 * (`in-flight` map), so a page that fires several requests at once validates
 * only once.
 */
@Injectable()
export class SessionValidationCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Promise<AuthUser>>();

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  get(sessionId: string): AuthUser | null {
    const entry = this.entries.get(sessionId);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(sessionId);
      return null;
    }
    return entry.user;
  }

  async getOrValidate(
    sessionId: string,
    loader: () => Promise<{ user: AuthUser; expiresAt: Date }>,
  ): Promise<AuthUser> {
    const cached = this.get(sessionId);
    if (cached) return cached;

    const pending = this.inFlight.get(sessionId);
    if (pending) return pending;

    const promise = loader()
      .then(({ user, expiresAt }) => {
        this.set(sessionId, user, expiresAt);
        return user;
      })
      .finally(() => {
        this.inFlight.delete(sessionId);
      });

    this.inFlight.set(sessionId, promise);
    return promise;
  }

  delete(sessionId: string): void {
    this.entries.delete(sessionId);
    this.inFlight.delete(sessionId);
  }

  /** Stores a session validated by another flow (login, register, refresh). */
  remember(sessionId: string, user: AuthUser, expiresAt: Date): void {
    this.set(sessionId, user, expiresAt);
  }

  private set(sessionId: string, user: AuthUser, expiresAt: Date): void {
    const ttl = this.config.get("sessionCacheTtlMs", { infer: true });
    if (ttl <= 0) return;

    const deadline = Math.min(Date.now() + ttl, expiresAt.getTime());
    if (deadline <= Date.now()) return;

    if (this.entries.size >= MAX_ENTRIES) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }

    this.entries.set(sessionId, { user, expiresAt: deadline });
  }
}
