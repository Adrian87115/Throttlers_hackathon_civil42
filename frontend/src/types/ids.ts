import type Opaque from 'ts-opaque';

export type AccessToken = Opaque<string, 'AccessToken'>;

export type RefreshToken = Opaque<string, 'RefreshToken'>;
