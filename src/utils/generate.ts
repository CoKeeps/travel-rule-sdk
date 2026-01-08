import { exportJWK, importJWK, SignJWT, type JWK } from "jose";
import { VaspKeys, KeyLike, BodyType, BodyReturnType} from "./type";
import { v4 as uuidv4 } from 'uuid';
import { SDKError, ValidationError } from "../errors";

export function stripPrivateJwkParams(jwk: JWK): JWK {
    const cleaned: any = { ...jwk };
    delete cleaned.d;
    delete cleaned.p;
    delete cleaned.q;
    delete cleaned.dp;
    delete cleaned.dq;
    delete cleaned.qi;
    delete cleaned.oth;
    return cleaned as JWK;
  }

export async function genClientAssertion(
    vasp_key: VaspKeys,
    client_id: string,
    tokenEndpoint: string,
  ) {
    if (!vasp_key?.sig?.priv) {
      throw new ValidationError('Signature private key (sig.priv) is required in vaspKeys', 'vaspKeys.sig.priv');
    }
    if (!client_id || typeof client_id !== 'string' || !client_id.trim()) {
      throw new ValidationError('client_id must be a non-empty string', 'client_id');
    }
    if (!tokenEndpoint || typeof tokenEndpoint !== 'string' || !tokenEndpoint.trim()) {
      throw new ValidationError('tokenEndpoint must be a non-empty string', 'tokenEndpoint');
    }
    
    try {
      new URL(tokenEndpoint);
    } catch {
      throw new ValidationError('tokenEndpoint must be a valid URL', 'tokenEndpoint');
    }
  
    const SIG_PRIV = vasp_key.sig.priv;
    const sigAlg = SIG_PRIV.alg ?? "ES256";
    const sigKid = SIG_PRIV.kid;
    
    if (!sigKid) {
      throw new ValidationError(
        'Signature key ID (kid) is required in sig.priv',
        'vaspKeys.sig.priv.kid'
      );
    }
  
    try {
      const sigKey = (await importJWK(SIG_PRIV, sigAlg)) as KeyLike;
      
      const now = Math.floor(Date.now() / 1000);
      const clientAssertion = await new SignJWT({ jti: uuidv4() })
        .setProtectedHeader({ alg: sigAlg, kid: sigKid, typ: "JWT" })
        .setIssuer(client_id)
        .setSubject(client_id)
        .setAudience(tokenEndpoint)
        .setIssuedAt(now)
        .setExpirationTime(now + 300)
        .sign(sigKey);
      
      return clientAssertion;
    } catch (error: any) {
      if (error instanceof SDKError || error instanceof ValidationError) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw new SDKError(
          `Failed to generate client assertion: ${error.message}`,
          error
        );
      }
      throw new SDKError('Failed to generate client assertion: Unknown error');
    }
  }

  export async function genDpopProof(
    vasp_key: VaspKeys,
    tokenEndpoint: string,
    accessToken?: string,
    htm?: string
  ) {
    if (!vasp_key?.dpop?.priv) {
      throw new ValidationError('DPoP private key (dpop.priv) is required in vaspKeys', 'vaspKeys.dpop.priv');
    }
    if (!tokenEndpoint || typeof tokenEndpoint !== 'string' || !tokenEndpoint.trim()) {
      throw new ValidationError('tokenEndpoint must be a non-empty string', 'tokenEndpoint');
    }
    
    try {
      new URL(tokenEndpoint);
    } catch {
      throw new ValidationError('tokenEndpoint must be a valid URL', 'tokenEndpoint');
    }
    
    if (htm !== undefined && typeof htm !== 'string') {
      throw new ValidationError('htm must be a string if provided', 'htm');
    }
  
    const DPOP_PRIV = vasp_key.dpop.priv;
    const dpopAlg = DPOP_PRIV.alg ?? "ES256";
    const dpopKid = DPOP_PRIV.kid;
    
    if (!dpopKid) {
      throw new ValidationError(
        'DPoP key ID (kid) is required in dpop.priv',
        'vaspKeys.dpop.priv.kid'
      );
    }
  
    try {
      const dpopKey = (await importJWK(DPOP_PRIV, dpopAlg, { extractable: true })) as KeyLike;
      
      const exported = await exportJWK(dpopKey);
      const dpopPubJwk: JWK = stripPrivateJwkParams({
        ...(vasp_key.dpop.pub ?? exported),
        kid: dpopKid,
      });
      
      const now = Math.floor(Date.now() / 1000);
      const toSign = {
        htu: tokenEndpoint,
        htm: "POST",
        jti: uuidv4(),
        iat: now,
      } as Record<string,any>;
      
      if (accessToken) {
        if (typeof accessToken !== 'string' || !accessToken.trim()) {
          throw new ValidationError('accessToken must be a non-empty string if provided', 'accessToken');
        }
        
        const encoder = new TextEncoder();
        const data = encoder.encode(accessToken);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        
        let hashBase64: string;
        if (typeof Buffer !== 'undefined') {
          hashBase64 = Buffer.from(hashArray).toString('base64');
        } else {
          hashBase64 = btoa(String.fromCharCode(...hashArray));
        }
        
        const ath = hashBase64
          .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
        
        toSign.htm = htm || "GET";
        toSign.ath = ath;
      }
  
      const dpopProof = await new SignJWT(toSign)
        .setProtectedHeader({ alg: dpopAlg, typ: "dpop+jwt", jwk: dpopPubJwk })
        .sign(dpopKey);
      
      return dpopProof;
    } catch (error: any) {
      if (error instanceof SDKError || error instanceof ValidationError) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw new SDKError(
          `Failed to generate DPoP proof: ${error.message}`,
          error
        );
      }
      throw new SDKError('Failed to generate DPoP proof: Unknown error');
    }
  }

export function generateBody(type: BodyType, vasp_id?: string, clientAssertion?: string, formData?: any): BodyReturnType {
  if (!type || (type !== 'token' && type !== 'sendMessage')) {
    throw new ValidationError(
      `Invalid body type: ${type}. Must be 'token' or 'sendMessage'`,
      'type'
    );
  }
  
  if (type === 'token') {
    const params: Record<string, string> = {
      grant_type: "client_credentials",
      scope: "read write",
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    };
    
    if (vasp_id) {
      if (typeof vasp_id !== 'string' || !vasp_id.trim()) {
        throw new ValidationError('vasp_id must be a non-empty string if provided', 'vasp_id');
      }
      params.vasp_id = vasp_id;
    }
    
    if (clientAssertion) {
      if (typeof clientAssertion !== 'string' || !clientAssertion.trim()) {
        throw new ValidationError('clientAssertion must be a non-empty string if provided', 'clientAssertion');
      }
      params.client_assertion = clientAssertion;
    }
    
    return new URLSearchParams(params);
  } else if (type === 'sendMessage') {
    if (!formData) {
      throw new ValidationError('formData is required for sendMessage type', 'formData');
    }
    try {
      return JSON.stringify(formData);
    } catch (error: any) {
      throw new SDKError(
        `Failed to stringify formData: ${error.message}`,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  throw new SDKError(`Invalid body type: ${type}`);
}