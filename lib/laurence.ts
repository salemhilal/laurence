/**
 * This file wraps the native window.fetch method in order to
 * allow you to replay fetch requests.
 *
 * TODO: Refactor this into a method that accepts `fetch` as an
 * argument and wraps it, and hen separately run logic that calls
 * said function on the window. This'll make it possible to test.
 */

/** Types **/

type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

interface OfflineCacheValue {
    status: number;
    statusText: string;
    body: string;
}

/** Constants **/

const CACHE_PREFIX = "__offline_cache_key::";
const LOG_PREFIX = "[OFFLINE CACHE]:";

/** The magic */

function init() {
    (function(window) {
        var theRealFetch = window.fetch;

        window.fetch = function fetchWithOfflineReplays(
            input: RequestInfo,
            init?: RequestInit
        ): Promise<Response> {
            let requestUrl = "";
            let requestMethod = "GET";

            if (input instanceof Request) {
                requestUrl = input.url;
                requestMethod = input.method;
            } else {
                requestUrl = input;
                requestMethod = "GET";
            }

            // This is how we'll cache network requests
            let key = `${CACHE_PREFIX}${requestMethod}::${requestUrl}`;

            if (navigator.onLine === true) {
                // ohhhhh shit we're online
                return fetchAndCache(theRealFetch, input, init);
            } else {
                return attemptFetchFromCache(input, init);
            }
        };
    })(window);
}

/**
 * Wraps window.fetch and caches successful network requests in localStorage
 *
 * @param  {function} fetch:                from window.fetch
 * @param  {RequestInfo} input:             RequestInfo   input for fetch
 * @param  {RequestInit | undefined} init:  init object for fetch
 * @return {Promise<Response>}
 */
function fetchAndCache(
    fetch: Fetch,
    input: RequestInfo,
    init?: RequestInit
): Promise<Response> {
    return fetch(input, init).then((response: Response) => {
        // cache the response for The Future™, but only if the
        // request was a successful one (no one will be happy if
        // we cache an error and it overwrites a legit response)
        if (!response.ok) {
            return response;
        }

        // This response has two destinations; the cache, and
        // wherever it gets used in the application. Once you
        // play a response body into text, you can't replay that
        // body. So, we clone the response, send one to the cache,
        // and return one to the application as though nothing happened.
        response
            .clone()
            .text()
            .then(text => {
                // We gotta cache all the parts of a Request
                // so that we can re-assemble these parts on the
                // other side.
                let value = JSON.stringify({
                    status: response.status,
                    statusText: response.statusText,
                    body: text
                } as OfflineCacheValue);
                let key = generateKey(input);

                localStorage.setItem(key, value);
            });

        return response;
    });
}

/**
 * Given arguments to `window.fetch`, attempts to return fetched network
 * data from the cache.
 *
 * @param  {[type]} input: RequestInfo   [description]
 * @param  {[type]} init?: RequestInit   [description]
 * @return {[type]}        [description]
 */
function attemptFetchFromCache(
    input: RequestInfo,
    init?: RequestInit
): Promise<Response> {
    let requestUrl = input instanceof Request ? input.url : input;
    console.log(
        `${LOG_PREFIX} You are offline. Checking cache for ${requestUrl}...`
    );

    let key = generateKey(input);
    let value = localStorage.getItem(key);

    // ok let's see if we cached the request we cared about
    // before we went offline
    if (value === null) {
        // unfortunately we can't do much here.
        return Promise.reject(
            "There was an offline request made with no cached response."
        );
    }

    // Ok, we actually have a cache value! let's read it back
    let cachedResponse = JSON.parse(value) as OfflineCacheValue;
    let response = new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText
    });

    console.log(
        `${LOG_PREFIX} Found a cached response with a body of length ${
            cachedResponse.body.length
        }`
    );

    return Promise.resolve(response);
}

/**
 * Given RequestInfo (url or Request object), generate a cache key for the request
 *
 * @param  {RequestInfo} input: the request that you'd pass to `fetch()`
 * @return {String} :           the cache key
 */
function generateKey(input: RequestInfo): string {
    let requestUrl = input instanceof Request ? input.url : input;
    let requestMethod = input instanceof Request ? input.method : "GET";

    // Cache requests by the url and the method.
    // This could be improved by also caching headers somehow
    return `${CACHE_PREFIX}${requestMethod}::${requestUrl}`;
}

init();

