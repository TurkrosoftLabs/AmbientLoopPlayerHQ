const APP_CACHE = "app-cache";
const AUDIO_CACHE = "audio-cache";

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

    event.waitUntil((async () => {

        const cache = await caches.open(APP_CACHE);

        for (const file of APP_FILES) {

            try {

                const response = await fetch(file, {
                    cache: "no-cache"
                });

                if (response.ok) {
                    await cache.put(file, response);
                }

            }
            catch {
                // Ignore failures. The file will be fetched later if needed.
            }

        }

    })());

    self.skipWaiting();

});

// Activate
self.addEventListener("activate", event => {

    event.waitUntil(self.clients.claim());

});

// Fetch
self.addEventListener("fetch", event => {

    if (event.request.method !== "GET")
        return;

    const url = new URL(event.request.url);

    if (url.pathname.endsWith(".wav")) {

        event.respondWith(handleAudio(event.request));
        return;

    }

    event.respondWith(handleAppFile(event.request));

});

async function handleAppFile(request) {

    const cache = await caches.open(APP_CACHE);

    try {

        const response = await fetch(request, {
            cache: "no-cache"
        });

        if (response.ok) {
            await cache.put(request, response.clone());
        }

        return response;

    }
    catch {

        const cached = await cache.match(request);

        if (cached)
            return cached;

        throw new Error("Network unavailable and file not cached.");

    }

}

async function handleAudio(request) {

    const cache = await caches.open(AUDIO_CACHE);

    const cached = await cache.match(request);

    if (cached) {

        // Update in the background without delaying playback.
        fetch(request, {
            cache: "no-cache"
        })
        .then(async response => {

            if (response.ok) {
                await cache.put(request, response.clone());
            }

        })
        .catch(() => {
            // Ignore network failures.
        });

        return cached;

    }

    // First time this audio is requested.

    const response = await fetch(request, {
        cache: "no-cache"
    });

    if (response.ok) {
        await cache.put(request, response.clone());
    }

    return response;

}
