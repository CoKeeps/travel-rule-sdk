import { z } from 'zod';
export declare const validateKeyEntry: (entry: any, entryName?: string) => {
    valid: boolean;
    error?: string;
};
export declare const validateVaspKeysWithError: (data: any) => {
    valid: boolean;
    error?: string;
};
declare const MessageFormDataSchema: z.ZodObject<{
    ivms101Version: z.ZodString;
    messageId: z.ZodString;
    createdAt: z.ZodString;
    transfer: z.ZodObject<{
        direction: z.ZodEnum<{
            OUTBOUND: "OUTBOUND";
            INBOUND: "INBOUND";
        }>;
        asset: z.ZodString;
        amount: z.ZodString;
        network: z.ZodString;
        txHash: z.ZodString;
        originatingAddress: z.ZodString;
        beneficiaryAddress: z.ZodString;
        memoOrTag: z.ZodOptional<z.ZodString>;
        internalRef: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    originatingVasp: z.ZodObject<{
        vaspName: z.ZodString;
        vaspIdentifier: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<{
                LEI: "LEI";
                BIC: "BIC";
                LOCAL: "LOCAL";
                OTHER: "OTHER";
            }>;
            value: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    beneficiaryVasp: z.ZodObject<{
        vaspName: z.ZodString;
        vaspIdentifier: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<{
                LEI: "LEI";
                BIC: "BIC";
                LOCAL: "LOCAL";
                OTHER: "OTHER";
            }>;
            value: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    originator: z.ZodObject<{
        type: z.ZodEnum<{
            NATURAL: "NATURAL";
            LEGAL: "LEGAL";
        }>;
        name: z.ZodObject<{
            nameIdentifier: z.ZodArray<z.ZodObject<{
                primaryIdentifier: z.ZodString;
                secondaryIdentifier: z.ZodOptional<z.ZodString>;
                nameIdentifierType: z.ZodEnum<{
                    LEGL: "LEGL";
                    ALIA: "ALIA";
                    TRAD: "TRAD";
                }>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        customerIdentification: z.ZodOptional<z.ZodString>;
        accountNumber: z.ZodOptional<z.ZodString>;
        geographicAddress: z.ZodArray<z.ZodObject<{
            addressType: z.ZodOptional<z.ZodEnum<{
                HOME: "HOME";
                BIZZ: "BIZZ";
                GEOG: "GEOG";
            }>>;
            streetName: z.ZodOptional<z.ZodString>;
            buildingNumber: z.ZodOptional<z.ZodString>;
            townName: z.ZodOptional<z.ZodString>;
            countrySubDivision: z.ZodOptional<z.ZodString>;
            postCode: z.ZodOptional<z.ZodString>;
            country: z.ZodString;
        }, z.core.$strip>>;
        nationalIdentification: z.ZodOptional<z.ZodArray<z.ZodObject<{
            nationalIdentifier: z.ZodString;
            nationalIdentifierType: z.ZodOptional<z.ZodEnum<{
                ARNU: "ARNU";
                CCPT: "CCPT";
                DRLC: "DRLC";
                NIDN: "NIDN";
                TXID: "TXID";
                SOCS: "SOCS";
                RAID: "RAID";
                LEIX: "LEIX";
            }>>;
            countryOfIssue: z.ZodString;
        }, z.core.$strip>>>;
        dateAndPlaceOfBirth: z.ZodOptional<z.ZodObject<{
            birthDate: z.ZodOptional<z.ZodString>;
            cityOfBirth: z.ZodOptional<z.ZodString>;
            countryOfBirth: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    beneficiary: z.ZodObject<{
        type: z.ZodEnum<{
            NATURAL: "NATURAL";
            LEGAL: "LEGAL";
        }>;
        name: z.ZodObject<{
            nameIdentifier: z.ZodArray<z.ZodObject<{
                primaryIdentifier: z.ZodString;
                secondaryIdentifier: z.ZodOptional<z.ZodString>;
                nameIdentifierType: z.ZodEnum<{
                    LEGL: "LEGL";
                    ALIA: "ALIA";
                    TRAD: "TRAD";
                }>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        customerIdentification: z.ZodOptional<z.ZodString>;
        accountNumber: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    contact: z.ZodOptional<z.ZodObject<{
        complianceEmail: z.ZodString;
        supportReference: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const validateMessageFormData: (data: any) => {
    valid: boolean;
    error?: string;
};
export type MessageFormData = z.infer<typeof MessageFormDataSchema>;
export {};
//# sourceMappingURL=validate.d.ts.map