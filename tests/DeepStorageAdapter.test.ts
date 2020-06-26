import DeepStorageAdapter, { IKeyStorage, FLAT_TOKEN } from '../src';

class MemStore implements IKeyStorage {
    data: { [key: string]: string } = {};

    getItem(key: string) {
        return this.data[key];
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

let memStore = new MemStore();
let deepStore = new DeepStorageAdapter(memStore);

describe('DeepStorageAdapter', () => {

    afterEach(() => {
        memStore.clear();
    });

    describe('saveItem / loadItem', () => {

        it('should save and load a string value', async () => {
            await deepStore.setItem('foo', 'bar');
            let val = await deepStore.getItem('foo');
            expect(val).toBe('bar');
        });

        it('should save and load a number value', async () => {
            await deepStore.setItem('foo', 123);
            let val = await deepStore.getItem('foo');
            expect(val).toStrictEqual(123);
        });

        it('should save and load an object', async () => {
            await deepStore.setItem('foo', { 'bar': 'test' });
            let data = await deepStore.getItem('foo');
            expect(data).toMatchObject({ 'bar': 'test' });
        });

        it('should save and load an object with numbers', async () => {
            await deepStore.setItem('foo', { 'bar': 123 });
            let data = await deepStore.getItem('foo');
            expect(data).toMatchObject({ 'bar': 123 });
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
            await deepStore.setItem('foo', { 'bar': 123 });
            await deepStore.setItem('foo', { 'new': 'x' });
            let data = await deepStore.getItem('foo');
            expect(data).toMatchObject({ 'new': 'x' });
            expect(Object.keys(memStore.data)).toContain(FLAT_TOKEN + 'foo/new');
            expect(Object.keys(memStore.data)).not.toContain(FLAT_TOKEN + 'foo/bar');
        });
    });

    describe('removeItem', () => {

        it('should remove primitive values', async () => {
            await deepStore.setItem('a', 'b');
            await deepStore.setItem('x', 1);
            await deepStore.removeItem('a');
            expect(Object.keys(memStore.data)).toEqual(['x']);
        });

        it('should remove object values', async () => {
            await deepStore.setItem('foo', { 'bar': 123 });
            await deepStore.setItem('x', 1);
            await deepStore.removeItem('foo');
            expect(Object.keys(memStore.data)).toEqual(['x']);
        });
    });

    describe('clear', () => {

        it('should clear', async () => {
            await deepStore.setItem('a', 'b');
            await deepStore.setItem('x', 1);
            await deepStore.clear();
            expect(Object.keys(memStore.data)).toEqual([]);
        });
    });
});
