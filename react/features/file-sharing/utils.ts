const generateDownloadUrl = async (url: string) => {
    const resp = await fetch(url);
    const respBlob = await resp.blob();

    const blob = new Blob([ respBlob ]);

    // @ts-ignore
    return URL.createObjectURL(blob);
};

export const downloadFile = async (url: string, fileName: string) => {
    const dowloadUrl = await generateDownloadUrl(url);
    const link = document.createElement('a');

    if (fileName) {
        link.download = fileName;
    }
    link.href = dowloadUrl;

    document.body.appendChild(link);
    link.click();
    link.remove();

    // fix for certain browsers
    setTimeout(() => {

        // @ts-ignore
        URL.revokeObjectURL(dowloadUrl);
    }, 0);
};
