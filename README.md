# deep-storage-adapter

Turns a flat key-value store into a pseudo-document store.

![Node.js CI](https://github.com/diatche/deep-storage-adapter/workflows/Node.js%20CI/badge.svg)

*Note that this package is in early stages of development and there may be breaking changes within semantically compatible versions. See [change log](CHANGELOG.md).*

## Installation

```
yarn add deep-storage-adapter
```

## Usage

```javascript
let deepStore = new DeepStorageAdapter({
    store: sessionStorage,
    encoder: require("base62/lib/ascii"), // See https://github.com/base62/base62.js
});

deepStore.setItem('item', {
    foo: 'bar',
    type: 2
});

let item = deepStore.getItem('item');
// item matches original object
```
