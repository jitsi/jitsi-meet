import { RpcAepp as rpcAepp, Node as node } from '@aeternity/aepp-sdk/es';

export let client;

export const initClient = async () => {

    const NODE_URL = 'https://mainnet.aeternity.io';
    const COMPILER_URL = 'https://latest.compiler.aepps.com';

    client = await rpcAepp({
        name: 'Superhero-league',
        nodes: [ {
            name: 'mainnet',
            instance: await node({
                url: NODE_URL
            })
        } ],
        compilerUrl: COMPILER_URL
    });

    return;
};
