const FILES_TO_CACHE = [
    '/',
    '/stylesheets/style.css',
    '/javascripts/plain/main.js',
];
const CACHE_NAME='kajet-v1'
self.addEventListener("install", event => {

    caches.open(CACHE_NAME).then(function (cache) {

        return cache.addAll(FILES_TO_CACHE);

    });

});
self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request).then(response => {

            if (!response) {

                //fall back to the network fetch

                return fetch(event.request);

            }

            return response;

        })

    )

});
// evt.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => {
//         console.log('[ServiceWorker] Pre-caching offline page');
//         return cache.addAll(FILES_TO_CACHE);
//     })
// );