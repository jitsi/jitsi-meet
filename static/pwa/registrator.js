if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('pwa-worker.js')
        .then(reg => {
            console.log('Service worker registered.', reg);
        })
        .catch(err => {
            console.log(err);
        });
}
