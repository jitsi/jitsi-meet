import kemBuilder from "@dashlane/pqc-kem-kyber512-browser";
import { Buffer } from "buffer";

export async function getOpenpgp(): Promise<typeof import("openpgp")> {
    return import("openpgp");
}
export async function generateNewKeys(): Promise<{
    privateKeyArmored: string;
    publicKeyArmored: string;
    revocationCertificate: string;
    publicKyberKeyBase64: string;
    privateKyberKeyBase64: string;
}> {
    const openpgp = await getOpenpgp();

    const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
        userIDs: [{ email: "inxt@inxt.com" }],
        curve: "ed25519",
    });

    const kem = await kemBuilder();
    const { publicKey: publicKyberKey, privateKey: privateKyberKey } = await kem.keypair();

    return {
        privateKeyArmored: privateKey,
        publicKeyArmored: Buffer.from(publicKey).toString("base64"),
        revocationCertificate: Buffer.from(revocationCertificate).toString("base64"),
        publicKyberKeyBase64: Buffer.from(publicKyberKey).toString("base64"),
        privateKyberKeyBase64: Buffer.from(privateKyberKey).toString("base64"),
    };
}
