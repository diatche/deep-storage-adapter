import DeepStorageAdapter, { IKeyStorage, FLAT_TOKEN, IEncoder } from '../src';

class MemStore implements IKeyStorage {
    data: { [key: string]: string } = {};
    notFoundMarker: any = undefined;

    getItem(key: string) {
        if (key in this.data) {
            return this.data[key];
        } else {
            return this.notFoundMarker;
        }
    }

    setItem(key: string, val: string) {
        this.data[key] = val;
    }

    removeItem(key: string) {
        if (key in this.data) {
            delete this.data[key];
        }
    }

    clear() {
        this.data = {};
    }
}

class Encoder implements IEncoder {
    encode(value: string): string {
        return `_A_${value}_Z_`;
    }

    decode(data: string): string {
        if (!/_A_.*_Z_/.test(data)) {
            throw new Error('Invalid data');
        }
        return data.slice(3, data.length - 3);
    }
}

let store = new MemStore();
let encoder = new Encoder();
let deepStore = new DeepStorageAdapter({
    store,
    encoder,
    delimiter: '.',
});

describe('DeepStorageAdapter', () => {
    afterEach(() => {
        store.clear();
    });

    describe('saveItem / loadItem', () => {
        it('should save and load a string value', async () => {
            await deepStore.setItem('foo', 'bar');
            let val = await deepStore.getItem('foo');
            expect(val).toBe('bar');
            // Check encoding
            expect(store.data['foo']).toBe('_A_bar_Z_');
        });

        it('should save and load a number value', async () => {
            await deepStore.setItem('foo', 123);
            let val = await deepStore.getItem('foo');
            expect(val).toStrictEqual(123);
        });

        it('should save and load an object', async () => {
            await deepStore.setItem('foo', { bar: 'test' });
            let data = await deepStore.getItem('foo');
            expect(data).toMatchObject({ bar: 'test' });
        });

        it('should save and load an object with numbers', async () => {
            await deepStore.setItem('foo', { bar: 123 });
            let data = await deepStore.getItem('foo');
            expect(data).toMatchObject({ bar: 123 });
        });

        it('should save and load an empty object', async () => {
            await deepStore.setItem('foo', {});
            let data = await deepStore.getItem('foo');
            expect(data).toEqual({});
        });

        it('should save and load null', async () => {
            await deepStore.setItem('foo', null);
            let data = await deepStore.getItem('foo');
            expect(data).toStrictEqual(null);
        });

        it('should remove old values on object change', async () => {
            await deepStore.setItem('foo', { bar: 123 });
            await deepStore.setItem('foo', { new: 'x' });
            let data = await deepStore.getItem('foo');
            expect(data).toEqual({ new: 'x' });
            expect(Object.keys(store.data)).toContain(FLAT_TOKEN + 'foo.new');
            expect(Object.keys(store.data)).not.toContain(
                FLAT_TOKEN + 'foo.bar',
            );
        });

        it('should merge values with merge option', async () => {
            await deepStore.setItem('foo', { bar: 123, prop: 'abc' });
            await deepStore.setItem(
                'foo',
                { new: 'x', prop: 'xyz' },
                { merge: true },
            );
            let data = await deepStore.getItem('foo');
            expect(data).toEqual({ bar: 123, new: 'x', prop: 'xyz' });
            expect(Object.keys(store.data)).toContain(FLAT_TOKEN + 'foo.new');
            expect(Object.keys(store.data)).toContain(FLAT_TOKEN + 'foo.bar');
            expect(Object.keys(store.data)).toContain(FLAT_TOKEN + 'foo.prop');
        });

        it('should merge values with merge option overriding primite with object', async () => {
            await deepStore.setItem('foo', { bar: 123, prop: 'abc' });
            await deepStore.setItem(
                'foo',
                { new: 'x', prop: { zyx: true } },
                { merge: true },
            );
            let data = await deepStore.getItem('foo');
            expect(data).toEqual({ bar: 123, new: 'x', prop: { zyx: true } });
            expect(Object.keys(store.data)).toContain(FLAT_TOKEN + 'foo.new');
            expect(Object.keys(store.data)).toContain(FLAT_TOKEN + 'foo.bar');
            expect(Object.keys(store.data)).not.toContain(
                FLAT_TOKEN + 'foo.prop',
            );
            expect(Object.keys(store.data)).toContain(
                FLAT_TOKEN + 'foo.prop.xyz',
            );
        });

        it('should merge values with merge option overriding object with primitive', async () => {
            await deepStore.setItem('foo', { bar: 123, prop: { zyx: true } });
            await deepStore.setItem(
                'foo',
                { new: 'x', prop: 'abc' },
                { merge: true },
            );
            let data = await deepStore.getItem('foo');
            expect(data).toEqual({ bar: 123, new: 'x', prop: 'abc' });
            expect(Object.keys(store.data)).toContain(FLAT_TOKEN + 'foo.new');
            expect(Object.keys(store.data)).toContain(FLAT_TOKEN + 'foo.bar');
            expect(Object.keys(store.data)).toContain(FLAT_TOKEN + 'foo.prop');
            expect(Object.keys(store.data)).not.toContain(
                FLAT_TOKEN + 'foo.prop.xyz',
            );
        });

        it('should return undefined when key not found', async () => {
            let x = await deepStore.getItem('foo');
            expect(x).toBeUndefined();
        });

        it('should return undefined when key not found with null marker', async () => {
            let store = new MemStore();
            store.notFoundMarker = null;
            let deepStore = new DeepStorageAdapter({ store });
            let x = await deepStore.getItem('foo');
            expect(x).toBeUndefined();
        });
    });

    describe('removeItem', () => {
        it('should remove primitive values', async () => {
            await deepStore.setItem('a', 'b');
            await deepStore.setItem('x', 1);
            await deepStore.removeItem('a');
            expect(Object.keys(store.data)).toEqual(['x']);
        });

        it('should remove object values', async () => {
            await deepStore.setItem('foo', { bar: 123 });
            await deepStore.setItem('x', 1);
            await deepStore.removeItem('foo');
            expect(Object.keys(store.data)).toEqual(['x']);
        });
    });

    describe('clear', () => {
        it('should clear', async () => {
            await deepStore.setItem('a', 'b');
            await deepStore.setItem('x', 1);
            await deepStore.clear();
            expect(Object.keys(store.data)).toEqual([]);
        });
    });
});
