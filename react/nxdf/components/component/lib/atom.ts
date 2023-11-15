import { atom } from "recoil";

export interface ITodoTypes {
    email: boolean;
    password: boolean;
    wallet: boolean;
    discord: boolean;
}

export const DarkThemeState = atom<boolean>({
    key: "DarkTheme",
    default: true,
});

export const LangState = atom<string>({
    key: "language",
    default: "EN",
});
export const isShown = atom<boolean>({
    key: "shown",
    default: false,
});
export const isVerify = atom({
    key: "verify",
    default: { email: false, password: false, wallet: false, discord: false },
});
export const CompleteVerify = atom<boolean>({
    key: "compverify",
    default: false,
});
export const PubKey = atom<string>({
    key: "PubKey",
    default: "",
});
export const ProfileUrl = atom<string>({
    key: "ProfileUrl",
    default: "",
});
