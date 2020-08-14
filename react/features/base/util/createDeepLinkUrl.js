export const createDeepLinkUrl = ({ type, ...params }) => {
    const url = new URL(`https://wallet.superhero.com/${type}`);

    url.searchParams.set('x-success', window.location);
    url.searchParams.set('x-cancel', window.location);
    Object.entries(params)
        .filter(([ , value ]) => ![ undefined, null ].includes(value))
        .forEach(([ name, value ]) => url.searchParams.set(name, value));

    return url;
};
