const generateDownloadUrl = async (url: string) => {
    const resp = await fetch(url);

    if (!resp.ok) {
        throw new Error(`Failed to download file: ${resp.status} ${resp.statusText}`);
    }

    const respBlob = await resp.blob();

    const blob = new Blob([ respBlob ]);

    return URL.createObjectURL(blob);
};

export const downloadFile = async (url: string, fileName: string) => {
    const downloadUrl = await generateDownloadUrl(url);
    const link = document.createElement('a');

    if (fileName) {
        link.download = fileName;
    }
    link.href = downloadUrl;

    document.body.appendChild(link);
    link.click();
    link.remove();

    // fix for certain browsers
    setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
    }, 0);
};
