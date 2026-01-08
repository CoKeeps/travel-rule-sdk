import { compactDecrypt, flattenedDecrypt, importJWK } from "jose";
import { VaspKeys } from "./type";
import { SDKError, ValidationError } from "../errors";

export async function decryptJwePayload(
    vasp_key: VaspKeys,
    payloadJwe: string | Uint8Array
  ) {
    if (!vasp_key?.enc?.priv) {
      throw new ValidationError('Encryption private key (enc.priv) is required in vaspKeys', 'vaspKeys.enc.priv');
    }
    if (!payloadJwe) {
      throw new ValidationError('payloadJwe is required', 'payloadJwe');
    }
    
    const isValidType = 
      typeof payloadJwe === 'string' || 
      payloadJwe instanceof Uint8Array || 
      (payloadJwe !== null && typeof payloadJwe === 'object');
    
    if (!isValidType) {
      throw new ValidationError(
        `payloadJwe must be a string, Uint8Array, or object. Received: ${typeof payloadJwe}`,
        'payloadJwe'
      );
    }
  
    const ENC_PRIV = vasp_key.enc.priv;
    const encAlg = ENC_PRIV.alg || "RSA-OAEP-256";
    
    try {
      const encPrivKey = await importJWK(ENC_PRIV, encAlg);
      
      let plaintext: Uint8Array | undefined;
      if (typeof payloadJwe === "string" || payloadJwe instanceof Uint8Array) {
        ({ plaintext } = await compactDecrypt(payloadJwe, encPrivKey));
      } else if (payloadJwe && typeof payloadJwe === "object") {
        ({ plaintext } = await flattenedDecrypt(payloadJwe, encPrivKey));
      } else {
        throw new SDKError(`Invalid payloadJwe type: ${typeof payloadJwe}`);
      }
      
      if (!plaintext) {
        throw new SDKError('Decryption succeeded but no plaintext was returned');
      }
      
      try {
        return JSON.parse(new TextDecoder().decode(plaintext));
      } catch (parseError: any) {
        throw new SDKError(
          `Failed to parse decrypted payload as JSON: ${parseError.message}`,
          parseError instanceof Error ? parseError : undefined
        );
      }
    } catch (error: any) {
      if (error instanceof SDKError || error instanceof ValidationError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.message.includes('decryption') || error.message.includes('decrypt')) {
          throw new SDKError(
            `Decryption failed: ${error.message}. Check that the encryption key matches the payload.`,
            error
          );
        }
        if (error.message.includes('import') || error.message.includes('key')) {
          throw new SDKError(
            `Failed to import encryption key: ${error.message}. Check that enc.priv is valid.`,
            error
          );
        }
        throw new SDKError(
          `Failed to decrypt JWE payload: ${error.message}`,
          error
        );
      }
      
      throw new SDKError('Failed to decrypt JWE payload: Unknown error');
    }
  }