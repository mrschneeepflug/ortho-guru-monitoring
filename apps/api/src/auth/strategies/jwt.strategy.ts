import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwksClient } from 'jwks-rsa';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AuthService } from '../auth.service';

/** Auth0 JWT payload shape (superset of our local JwtPayload) */
interface Auth0TokenPayload {
  sub: string;
  email?: string;
  name?: string;
  aud?: string | string[];
  [key: string]: unknown;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private jwksClient: JwksClient | null = null;

  constructor(private readonly authService: AuthService) {
    const auth0Domain = process.env.AUTH0_DOMAIN;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: auth0Domain ? ['RS256', 'HS256'] : ['HS256'],
      secretOrKeyProvider: (
        _request: unknown,
        rawJwtToken: string,
        done: (err: Error | null, secret?: string) => void,
      ) => {
        try {
          // Decode the header without verifying to check for kid
          const headerBase64 = rawJwtToken.split('.')[0];
          const header = JSON.parse(
            Buffer.from(headerBase64, 'base64').toString('utf8'),
          );

          if (header.kid && auth0Domain) {
            // Auth0 RS256 token — fetch public key from JWKS
            if (!this.jwksClient) {
              this.jwksClient = new JwksClient({
                jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
                cache: true,
                cacheMaxAge: 600000, // 10 minutes
              });
            }
            this.jwksClient.getSigningKey(header.kid, (err, key) => {
              if (err) {
                return done(err);
              }
              done(null, key?.getPublicKey());
            });
          } else {
            // Local HS256 token
            done(null, process.env.JWT_SECRET || 'dev-secret');
          }
        } catch (err) {
          done(err instanceof Error ? err : new Error(String(err)));
        }
      },
    });
  }

  async validate(payload: Auth0TokenPayload & Record<string, unknown>): Promise<JwtPayload> {
    // Patient tokens carry type: 'patient'
    if (payload.type === 'patient') {
      return {
        sub: payload.sub,
        patientId: payload.patientId as string,
        email: payload.email || '',
        practiceId: payload.practiceId as string,
        type: 'patient',
      };
    }

    // Auth0 tokens have sub like "auth0|abc123" or "google-oauth2|..."
    const isAuth0Token =
      payload.sub?.includes('|') && process.env.AUTH0_DOMAIN;

    if (isAuth0Token) {
      // Check audience for Auth0 tokens
      const expectedAudience = process.env.AUTH0_AUDIENCE;
      if (expectedAudience && payload.aud !== expectedAudience) {
        const audArray = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
        if (!audArray.includes(expectedAudience)) {
          throw new UnauthorizedException('Invalid token audience');
        }
      }

      // Find or create the doctor for this Auth0 user
      const doctor = await this.authService.findOrCreateAuth0User(
        payload.sub,
        payload.email || '',
        payload.name || payload.email || '',
      );

      return {
        sub: doctor.id,
        email: doctor.email,
        role: doctor.role,
        practiceId: doctor.practiceId,
        type: 'doctor',
      };
    }

    // Local doctor token — payload already has our shape
    return {
      sub: payload.sub,
      email: payload.email || '',
      role: payload.role as string,
      practiceId: payload.practiceId as string,
      type: 'doctor',
    };
  }
}
