import { QueryFunctionContext } from "@tanstack/react-query";
import axios from "axios";
import { alchemy } from "./alchemy";

export const getNFTList = async ({ queryKey }) => {
    const [_, pubkey] = queryKey;
    const { ownedNfts } = await alchemy.nft.getNftsForOwner(pubkey);
    const list = [];
    if (pubkey !== "") {
        ownedNfts.map((data) => {
            return data.description !== "" ? list.push(data) : "";
        });
        return list;
    }

    return;
};

export const getNFTDetail = async ({ queryKey }) => {
    const [_, nftname, nftnum] = queryKey;
    const data = await alchemy.nft.getNftMetadata(nftname, nftnum);
    console.log(data);
    // const list = [];
    // if (pubkey !== "") {
    //   ownedNfts.map((data) => {
    //     console.log(data);
    //     return data.description !== "" ? list.push(data.rawMetadata) : "";
    //   });
    //   return list;
    // }

    return data.rawMetadata;
};

export const getTestNFTLIST = async ({ queryKey }) => {
    const [_, pubkey] = queryKey;
    const { ownedNfts } = await alchemy.nft.getNftsForOwner(pubkey);
    const list = [];
    console.log(ownedNfts);
    if (pubkey !== "") {
        ownedNfts.map((data) => {
            return data.contract.address ===
                "0x64aa21d3c6de8dbda8af8976ffb8ddc83a8010bb" &&
                data.description !== ""
                ? list.push(data.rawMetadata)
                : "";
        });
        return list;
    }

    return;
};

export const getTRWList = async ({ queryKey }) => {
    const [_, pubkey] = queryKey;
    const { ownedNfts } = await alchemy.nft.getNftsForOwner(pubkey);
    const list = [];
    const listData = ownedNfts.map((data) => {
        return data.contract.address ===
            "0xD159eeC8EEF09E34E32aE222a69a5af8cbD4c8F2" &&
            data.description !== ""
            ? list.push(data.rawMetadata)
            : "";
    });
    return list;
};

//owner address

export const getNftOwner = async ({ queryKey }) => {
    const [_, pubkey] = queryKey;
    const address = "0xD159eeC8EEF09E34E32aE222a69a5af8cbD4c8F2";
    const owner = await alchemy.nft.getOwnersForNft(address, 1);
    console.log(owner);
    return owner;
};
export const getNftHolders = async ({ queryKey }) => {
    const [_, pubkey] = queryKey;
    const address = "0xcdc1def92c32d3aa6d4bc277e1d2bb4a0f3cb2f8";
    const owner = await alchemy.nft.getOwnersForContract(address);
    console.log(owner);
    return owner;
};
