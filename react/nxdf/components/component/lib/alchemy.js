import { Network, Alchemy } from "alchemy-sdk";

const settings = {
    apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
    network: Network.MATIC_MUMBAI,
    // network: Network.MATIC_MAINNET,
};
export const alchemy = new Alchemy(settings);
