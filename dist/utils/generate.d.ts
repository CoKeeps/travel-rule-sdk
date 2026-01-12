import { type JWK } from "jose";
import { VaspKeys, BodyType, BodyReturnType } from "./type";
export declare function stripPrivateJwkParams(jwk: JWK): JWK;
export declare function genClientAssertion(vasp_key: VaspKeys, client_id: string, tokenEndpoint: string): Promise<string>;
export declare function genDpopProof(vasp_key: VaspKeys, tokenEndpoint: string, accessToken?: string, htm?: string): Promise<string>;
export declare function generateBody(type: BodyType, vasp_id?: string, clientAssertion?: string, formData?: any): BodyReturnType;
//# sourceMappingURL=generate.d.ts.map