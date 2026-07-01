const CACHE_NAME = "ambient-player-v1";

const APP_FILES = [
    "./",
    "./index.html",
    "./sounds.js",
    "./manifest.webmanifest",
    "./icon-192.png",
    "./icon-512.png"
];

// Install
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(APP_FILES);
        })
    );

    self.skipWaiting();
});

// Activate
self.addEventListener("activate", event => {
    event.waitUntil(
        self.clients.claim()
    );
});

// Fetch
self.addEventListener("fetch", event => {

    // Only GET requests
    if (event.request.method !== "GET")
        return;

    event.respondWith(

        caches.match(event.request).then(async cached => {

            if (cached)
                return cached;

            const response = await fetch(event.request);

            // Cache audio files only after they're requested
            if (
                event.request.url.endsWith(".wav")
            ) {

                const cache = await caches.open(CACHE_NAME);

                cache.put(event.request, response.clone());

            }

            return response;

        })

    );

});
