export interface JwtPayload {
  sub: string; // doctor ID
  email: string;
  role: string;
  practiceId: string;
}
