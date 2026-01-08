import { importJWK, JWK } from "jose";
import z from "zod";

type KeyLike = Awaited<ReturnType<typeof importJWK>>;

type KeyEntry = {
  priv?: JWK & { kid?: string; alg?: string };
  pub?: JWK & { kid?: string; alg?: string };
};

type VaspKeys = {
  vasp_id: string;
  sig: KeyEntry;
  dpop: KeyEntry;
  enc: KeyEntry;
};

type BodyType = "token" | "sendMessage";

type BodyReturnType = URLSearchParams | string;

const nameIdentifierTypeEnum = z.enum(["LEGL", "ALIA", "TRAD"]);
const addressTypeEnum = z.enum(["HOME", "BIZZ", "GEOG"]);
const nationalIdentifierTypeEnum = z.enum([
  "ARNU",
  "CCPT",
  "DRLC",
  "NIDN",
  "TXID",
  "SOCS",
  "RAID",
  "LEIX",
]);
const transferDirectionEnum = z.enum(["OUTBOUND", "INBOUND"]);
const vaspIdentifierTypeEnum = z.enum(["LEI", "BIC", "LOCAL", "OTHER"]);
const personTypeEnum = z.enum(["NATURAL", "LEGAL"]);

export {
  nameIdentifierTypeEnum,
  addressTypeEnum,
  nationalIdentifierTypeEnum,
  transferDirectionEnum,
  vaspIdentifierTypeEnum,
  personTypeEnum,
  BodyType,
  BodyReturnType,
  VaspKeys,
  KeyLike,
  KeyEntry,
};
