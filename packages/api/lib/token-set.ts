export class TokenSet {
  public expiresAt: number;
  public access_token: string;

  constructor(access_token: string, expires_in: number) {
    this.expires_in = expires_in;
    this.access_token = access_token;
  }

  set expires_in(value) {
    this.expiresAt = Date.now() + Number(value);
  }

  get expires_in(): number {
    return Math.max(this.expiresAt - Date.now(), 0);
  }

  expired(): boolean {
    return this.expires_in === 0;
  }
}
