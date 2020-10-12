if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
      .register('pwa-worker.js')
      .then(reg => {
          console.log('Service worker registered.', reg);
      })
      .catch(err => {
          console.log(err);
      });
    });
}
