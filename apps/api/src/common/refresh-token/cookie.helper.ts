import { Response } from 'express';

interface CookieConfig {
  cookieName: string;
  cookiePath: string;
  refreshTokenTtlSeconds: number;
}

export function setRefreshCookie(res: Response, rawToken: string, config: CookieConfig): void {
  res.cookie(config.cookieName, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: config.cookiePath,
    maxAge: config.refreshTokenTtlSeconds * 1000,
  });
}

export function clearRefreshCookie(res: Response, config: CookieConfig): void {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: config.cookiePath,
  });
}
