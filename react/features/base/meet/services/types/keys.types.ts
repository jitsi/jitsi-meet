export class BadEncodedPrivateKeyError extends Error {
  constructor() {
    super('Private key is bad encoded');

    Object.setPrototypeOf(this, BadEncodedPrivateKeyError.prototype);
  }
}

export class WrongIterationsToEncryptPrivateKeyError extends Error {
  constructor() {
    super('Private key was encrypted using the wrong iterations number');

    Object.setPrototypeOf(this, WrongIterationsToEncryptPrivateKeyError.prototype);
  }
}

export class CorruptedEncryptedPrivateKeyError extends Error {
  constructor() {
    super('Private key is corrupted');

    Object.setPrototypeOf(this, CorruptedEncryptedPrivateKeyError.prototype);
  }
}

export class KeysDoNotMatchError extends Error {
  constructor() {
    super('Keys do not match');

    Object.setPrototypeOf(this, KeysDoNotMatchError.prototype);
  }
}

export interface AesInit {
  iv: string;
  salt: string;
}
