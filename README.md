# laurence
A simple cache for offline development. Assumes you use [`fetch()`][fetch] for requests.

## in short

1. install Laurence
2. make some network requests using `fetch()`
3. disconnect from the internet
4. make those same network requests successfully

## details
Sometimes you:
  * don’t have internet, but want to work on something that makes network requests.
  * _do_ have internet, but want work without getting distracted.

Laurence works by caching your requests into ``localStorage`` and replaying them while
your internet is offline. Laurence only caches successful requests, and checks
`navigator.onLine` to determine whether or not you’re connected to the internet.

Laurence works by wrapping `fetch()`, so you may want to use [a `fetch` polyfill][whatwg-fetch].

## installation
In your terminal,
```sh
npm install --save-dev laurence
```

and in your app,
```js
import "whatwg-fetch"; // Make sure any fetch polyfill you use comes first
import "laurence";     // Please don’t use this in prod though.
```

## some important notes

There’s a lot of things that are worth mentioning about Laurence.

### Laurence isn’t for production
I wrote Laurence at an airport in way less time than it should take to build something
production-ready, so **please don’t use this to actually cache parts of your app**. It
has no logic for cache invalidation and doesn’t come with all the other niceties 
that you’d expect from a cache (like TTL or eviction policies). It’s meant as a
development tool first and foremost.

### Laurence stores URLs as plain text in localStorage
This probably isn’t be a big deal, but you’ll want to make sure you’re thoughtful
about requests with API keys in them. They’ll sit around in your localStorage until
you manually evict them.

### Laurence caches requests based on URLs and request methods
Meaning `GET https://mozilla.org/robots.txt` and `POST https://mozilla.org/robots.txt`
are considered to be different. This method should work for most use cases, but it most
notably won’t work when your requests rely on headers. Speaking of, 

### Laurence doesn’t cache headers
This is still something that needs to be implemented. For now, it just caches status,
status text, and the actual body (which it reads out and persists as text). Also,. Also,. Also,. Also,



[fetch]:https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
[whatwg-fetch]:https://github.github.io/fetch/
