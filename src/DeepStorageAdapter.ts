import flatten, { unflatten } from 'flat';

export const FLAT_TOKEN = '__flat__';
export const FLAT_LIST = '__list__';
export const ENC_KEY = '__enc';

const DELIMITER = '.';

export interface IKeyStorage {
    getItem(key: string): Promise<any> | any;
    setItem(key: string, val: string): Promise<void> | void;
    removeItem(key: string): Promise<void> | void;
    /** Clear all items. */
    clear?: () => Promise<void> | void;
}

export interface IEncoder {
    encode(value: string): string;
    decode(data: string): string;
}

/**
 * Turns a flat key-value store into a pseudo-document
 * store. All objects are converted to individual entries.
 * The adapter does not store anything itself.
 */
export default class DeepStorageAdapter {
    /**
     * The underlying storage. The adapter does not store
     * anything itself.
     **/
    readonly store: IKeyStorage;
    /**
     * The encoder used for values.
     */
    readonly encoder: IEncoder | undefined;
    /**
     * Delimiter used for object key paths.
     */
    readonly delimiter: string;

    constructor({
        store,
        encoder,
        delimiter = DELIMITER,
    }: {
        store: IKeyStorage;
        encoder?: IEncoder;
        delimiter?: string;
    }) {
        if (!delimiter) {
            throw new Error('Delimiter mut not be empty');
        }

        this.store = store;
        this.encoder = encoder;
        this.delimiter = delimiter;
    }

    /**
     * Fetches, decodes and returns the value at the `key`.
     * @param key
     */
    async getItem(key: string): Promise<any> {
        key = this._normalizeKey(key);

        // Look for flattened data
        let flatKeys = await this._getFlatKeys(key);
        if (!flatKeys) {
            // Return primitive data
            return await this._getValue(key);
        }
        // Gather values
        let flatValues = await Promise.all(
            flatKeys.map(flatKey => {
                return this._getValue(flatKey);
            }),
        );
        let flatData: any = {};
        for (let i = 0; i < flatKeys.length; i++) {
            flatData[flatKeys[i]] = flatValues[i];
        }
        // Unflatten
        let data: any = unflatten(flatData, {
            delimiter: this.delimiter,
        });
        let rootKey = this._rootKey(key);
        if (!data[rootKey]) {
            throw new Error(
                `Unexpected data in KeyStore. Expected root key to be "${rootKey}", but got "${
                    Object.keys(data)[0]
                }"`,
            );
        }
        return data[rootKey];
    }

    /**
     * Encodes and stores the `value` at the `key`.
     * @param key
     */
    async setItem(key: string, value: any) {
        key = this._normalizeKey(key);

        // Clear first
        await this.removeItem(key);

        if (typeof value === 'undefined') {
            return;
        }

        if (typeof value === 'object' && value !== null) {
            // Flatten object
            let rootKey = this._rootKey(key);
            let data = { [rootKey]: value };
            let flatData: any = flatten(data, {
                delimiter: this.delimiter,
                safe: true,
            });
            let flatKeys: string[] = [];
            await Promise.all(
                Object.keys(flatData).map(key => {
                    flatKeys.push(key);
                    return this._saveValue(key, flatData[key]);
                }),
            );
            let listKey = this._listKey(rootKey);
            await this.store.setItem(listKey, JSON.stringify(flatKeys));
        } else {
            await this._saveValue(key, value);
        }
    }

    /**
     * Removes the value at the `key`.
     * @param key
     */
    async removeItem(key: string) {
        key = this._normalizeKey(key);

        // Remove everything related to this key
        let flatKeys = (await this._getFlatKeys(key)) || [];
        let rootKey = this._rootKey(key);
        let listKey = this._listKey(rootKey);
        let keys = flatKeys.concat([key, rootKey, listKey]);
        let promises = keys.map(k => this.store.removeItem(k));

        await Promise.all(promises);
    }

    /** Clear all items. */
    async clear() {
        if (!this.store.clear) {
            throw new Error('Not supported');
        }
        await this.store.clear!();
    }

    private _normalizeKey(key: string): string {
        if (!key) {
            throw new Error('Invalid key');
        }
        return String(key);
    }

    private async _getValue(key: string) {
        let data = await this.store.getItem(key);
        return this._decodeValue(data);
    }

    private _saveValue(key: string, value: any) {
        let data = this._encodeValue(value);
        if (typeof data !== 'undefined') {
            return this.store.setItem(key, data);
        }
    }

    private _encodeValue(value: any): string | undefined {
        if (typeof value === 'undefined') {
            return value;
        }
        if (typeof value !== 'string') {
            value = JSON.stringify({ [ENC_KEY]: value });
        }
        if (this.encoder) {
            // External encode
            value = this.encoder.encode(value);
        }
        return value;
    }

    private _decodeValue(data: string): any {
        if (typeof data === 'undefined' || data === null) {
            return undefined;
        }
        if (this.encoder) {
            // External decode
            data = this.encoder.decode(data);
        }
        if (!data?.startsWith('{')) {
            return data;
        }
        let value: any = data;
        try {
            let decode = JSON.parse(data)[ENC_KEY];
            if (typeof decode !== 'undefined') {
                value = decode;
            }
        } catch (e) {}
        return value;
    }

    private _rootKey(key: string): string {
        return FLAT_TOKEN + key;
    }

    private _listKey(rootKey: string): string {
        return rootKey + FLAT_LIST;
    }

    private async _getFlatKeys(key: string): Promise<string[] | undefined> {
        let rootKey = this._rootKey(key);
        let listKey = this._listKey(rootKey);
        let rootKeyJson = await this.store.getItem(listKey);
        if (!rootKeyJson) {
            return undefined;
        }
        return JSON.parse(rootKeyJson);
    }
}
