import z from "zod";
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
export { nameIdentifierTypeEnum, addressTypeEnum, nationalIdentifierTypeEnum, transferDirectionEnum, vaspIdentifierTypeEnum, personTypeEnum, };
//# sourceMappingURL=type.js.map