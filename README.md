# deep-storage-adapter

Turns a flat key-value store into a pseudo-document store.

![Node.js CI](https://github.com/diatche/deep-storage-adapter/workflows/Node.js%20CI/badge.svg)
[![NPM version](https://badge.fury.io/js/deep-storage-adapter.svg)](https://www.npmjs.com/package/deep-storage-adapter)
[![Dependencies](https://david-dm.org/diatche/deep-storage-adapter.svg)](https://david-dm.org/diatche/deep-storage-adapter)
[![CodeQL](https://github.com/diatche/deep-storage-adapter/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/diatche/deep-storage-adapter/actions/workflows/codeql-analysis.yml)

_Note that this package is in early stages of development and there may be breaking changes within semantically compatible versions. See [change log](CHANGELOG.md)._

## Installation

```
yarn add deep-storage-adapter
```

## Usage

```javascript
let deepStore = new DeepStorageAdapter({
    store: sessionStorage,
    encoder: require('base62/lib/ascii'), // See https://github.com/base62/base62.js
});

deepStore.setItem('item', {
    foo: 'bar',
    type: 2,
});

let item = deepStore.getItem('item');
// item matches original object
```
