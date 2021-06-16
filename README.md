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

## Description

The adapter does not store anything itself. It uses the specified storage in a way that allows setting and then retriving objects in their original form (as long as the values can be serialized).

Supports both async and sync storage conforming to:

```typescript
export interface IKeyStorage {
    getItem(key: string): Promise<any> | any;
    setItem(key: string, val: string): Promise<void> | void;
    removeItem(key: string): Promise<void> | void;
    clear?: () => Promise<void> | void;
}
```

## Usage

Note that even though sync stores are supported, the adapter's interface is async.

```javascript
let deepStore = new DeepStorageAdapter({
    store: AsyncStorage,
    encoder: require('base62/lib/ascii'), // See https://github.com/base62/base62.js
});

deepStore
    .setItem('item', {
        foo: 'bar',
        type: 2,
    })
    .then(() => deepStore.getItem('item'))
    .then(item => {
        // item matches original object
        console.log(JSON.stringify(item));
    });
```
