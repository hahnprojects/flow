export class TokenSet {
  public expiresAt: number;
  public access_token: string;

  constructor(values) {
    Object.assign(this, values);
  }

  set expires_in(value) {
    this.expiresAt = Date.now() + Number(value);
  }

  get expires_in() {
    return Math.max.apply(null, [this.expiresAt - Date.now(), 0]);
  }

  expired() {
    return this.expires_in === 0;
  }
}
