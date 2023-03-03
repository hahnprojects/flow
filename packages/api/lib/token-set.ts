const TOKEN_EXPIRATION_BUFFER = 20; // 20 seconds

export class TokenSet {
  private readonly _accessToken: string;
  private readonly _expiresAt: number;

  constructor(access_token: string, expires_in: number) {
    this._accessToken = access_token;
    this._expiresAt = Math.floor(Date.now() / 1000) + Number(expires_in);
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

  public isExpired(): boolean {
    return this.expiresIn <= TOKEN_EXPIRATION_BUFFER;
  }
}
