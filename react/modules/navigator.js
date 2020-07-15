import { atom } from "recoil";

export const screenState = atom({
  key: "screenName",
  default: "Login",
});
