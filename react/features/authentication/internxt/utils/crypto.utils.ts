import { ConfigService } from '../config.service';

export class CryptoUtils {
  static getAesInit(): { iv: string; salt: string } {
    return { iv: ConfigService.instance.get('REACT_APP_MAGIC_IV'), salt: ConfigService.instance.get('REACT_APP_MAGIC_SALT') };
  }
}
