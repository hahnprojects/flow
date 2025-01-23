const TOKEN_EXPIRATION_BUFFER = 20; // 20 seconds

export class TokenSet {
  private readonly _accessToken: string;
  private readonly _expiresAt: number;
  private readonly _provided: boolean;

  constructor(access_token: string, expires_in: number, provided = false) {
    this._accessToken = access_token;
    this._expiresAt = Math.floor(Date.now() / 1000) + Number(expires_in);
    this._provided = provided;
  }

  get accessToken(): string {
    return this._accessToken;
  }

  get expiresAt(): number {
    return this._expiresAt;
  }

  get expiresIn(): number {
    return Math.max(this.expiresAt - Math.ceil(Date.now() / 1000), 0);
  }

  get provided(): boolean {
    return this._provided;
  }

  public isExpired(): boolean {
    return this.expiresIn <= (this.provided ? 0 : TOKEN_EXPIRATION_BUFFER); // Use the entire time of provided token to avoid throwing 'expired' error early
  }
}
