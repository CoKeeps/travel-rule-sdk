import { importJWK, JWK } from "jose";
import z from "zod";
type KeyLike = Awaited<ReturnType<typeof importJWK>>;
type KeyEntry = {
    priv?: JWK & {
        kid?: string;
        alg?: string;
    };
    pub?: JWK & {
        kid?: string;
        alg?: string;
    };
};
type VaspKeys = {
    vasp_id: string;
    sig: KeyEntry;
    dpop: KeyEntry;
    enc: KeyEntry;
};
type BodyType = "token" | "sendMessage";
type BodyReturnType = URLSearchParams | string;
declare const nameIdentifierTypeEnum: z.ZodEnum<{
    LEGL: "LEGL";
    ALIA: "ALIA";
    TRAD: "TRAD";
}>;
declare const addressTypeEnum: z.ZodEnum<{
    HOME: "HOME";
    BIZZ: "BIZZ";
    GEOG: "GEOG";
}>;
declare const nationalIdentifierTypeEnum: z.ZodEnum<{
    ARNU: "ARNU";
    CCPT: "CCPT";
    DRLC: "DRLC";
    NIDN: "NIDN";
    TXID: "TXID";
    SOCS: "SOCS";
    RAID: "RAID";
    LEIX: "LEIX";
}>;
declare const transferDirectionEnum: z.ZodEnum<{
    OUTBOUND: "OUTBOUND";
    INBOUND: "INBOUND";
}>;
declare const vaspIdentifierTypeEnum: z.ZodEnum<{
    LEI: "LEI";
    BIC: "BIC";
    LOCAL: "LOCAL";
    OTHER: "OTHER";
}>;
declare const personTypeEnum: z.ZodEnum<{
    NATURAL: "NATURAL";
    LEGAL: "LEGAL";
}>;
export { nameIdentifierTypeEnum, addressTypeEnum, nationalIdentifierTypeEnum, transferDirectionEnum, vaspIdentifierTypeEnum, personTypeEnum, BodyType, BodyReturnType, VaspKeys, KeyLike, KeyEntry, };
//# sourceMappingURL=type.d.ts.map