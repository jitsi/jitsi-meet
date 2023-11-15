import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";

export default async function getMetamask() {
  let loading = false;
  const [account] = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const balance = await provider.getBalance(account);
  console.log(balance);
  if (account) {
    loading = true;
  }
  return {
    pubkey: account,
    balance,
    loading,
  };
}
