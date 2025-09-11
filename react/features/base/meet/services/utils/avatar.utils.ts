interface ExpirationConfig {
    datePattern: RegExp;
    expiresPattern: RegExp;
    dateTransform?: (match: string) => string;
}

type Provider = "AWS";

const PREFIX_PROVIDERS: Record<Provider, string> = {
    AWS: "X-Amz-",
};

const PROVIDER_CONFIGS: Record<string, ExpirationConfig> = {
    AWS: {
        datePattern: /X-Amz-Date=(\d{8}T\d{6})Z/,
        expiresPattern: /X-Amz-Expires=(\d+)/,
        dateTransform: (match) => match.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{6})$/, "$1-$2-$3T$4:$5:$6Z"),
    },
};

function detectProvider(url: string): string | null {
    if (url.includes(PREFIX_PROVIDERS["AWS"])) return "AWS";
    return null;
}

function getAvatarExpiration(url: string): Date | null {
    const provider = detectProvider(url);
    if (!provider || !PROVIDER_CONFIGS[provider]) return null;

    const config = PROVIDER_CONFIGS[provider];
    const dateMatch = config.datePattern.exec(url);
    const expiresMatch = config.expiresPattern.exec(url);

    if (!dateMatch || !expiresMatch) return null;

    let dateString = dateMatch[1];
    if (config.dateTransform) {
        dateString = config.dateTransform(dateString);
    }

    const issuedDate = new Date(dateString);
    const expiresIn = Number(expiresMatch[1]);

    if (isNaN(issuedDate.getTime())) return null;

    return new Date(issuedDate.getTime() + expiresIn * 1000);
}

function isAvatarExpired(url: string): boolean {
    const expirationDate = getAvatarExpiration(url);
    if (!expirationDate) return true;
    return new Date().toISOString() > expirationDate.toISOString();
}

export { isAvatarExpired };
