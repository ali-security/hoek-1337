import Util from 'util';
import { describe, it, expect } from 'vitest';


import * as Hoek from '../lib/index.ts';
import { type MergeTypes } from '../lib/merge.ts';

const nestedObj = {
    v: [7, 8, 9],
    w: /^something$/igm,
    x: {
        a: [1, 2, 3],
        b: 123456,
        c: new Date(),
        d: /hi/igm,
        e: /hello/
    },
    y: 'y',
    z: new Date(1378775452757)
};

describe('merge()', () => {

    it('deep copies source items', () => {

        const sym1 = Symbol('1');
        const sym2 = Symbol('2');
        const sym3 = Symbol('3');

        const target = {
            b: 3,
            d: [],
            [sym1]: true,
            [sym3]: true
        } as any;

        const source = {
            c: {
                d: 1
            },
            d: [{ e: 1 }],
            [sym2]: true,
            [sym3]: false
        };

        Hoek.merge(target, source);
        expect(target.c).not.toBe(source.c);
        expect(target.c).toHoequal(source.c);
        expect(target.d).not.toBe(source.d);
        expect(target.d[0]).not.toBe(source.d[0]);
        expect(target.d).toHoequal(source.d);

        expect(target[sym1]).toBe(true);
        expect(target[sym2]).toBe(true);
        expect(target[sym3]).toBe(false);
    });

    it('deep copies source items without symbols', () => {

        const sym1 = Symbol('1');
        const sym2 = Symbol('2');
        const sym3 = Symbol('3');

        const target = {
            b: 3,
            d: [],
            [sym1]: true,
            [sym3]: true
        } as any;

        const source = {
            c: {
                d: 1
            },
            d: [{ e: 1 }],
            [sym2]: true,
            [sym3]: false
        };

        Hoek.merge(target, source, { symbols: false });
        expect(target.c).not.toBe(source.c);
        expect(target.c).toHoequal(source.c);
        expect(target.d).not.toBe(source.d);
        expect(target.d[0]).not.toBe(source.d[0]);
        expect(target.d).toHoequal(source.d);

        expect(target[sym1]).toBe(true);
        expect(target[sym2]).toBeUndefined();
        expect(target[sym3]).toBe(true);
    });

    it('merges array over an object', () => {

        const a = {
            x: ['n', 'm']
        } as any;

        const b = {
            x: {
                n: '1',
                m: '2'
            }
        };

        Hoek.merge(b, a);
        expect(a.x[0]).toHoequal('n');
        expect(a.x.n).toBeUndefined();
    });

    it('merges object over an array', () => {

        const a = {
            x: ['n', 'm']
        } as any;

        const b = {
            x: {
                n: '1',
                m: '2'
            }
        };

        Hoek.merge(a, b);
        expect(a.x.n).toHoequal('1');
        expect(a.x[0]).toBeUndefined();
    });

    it('merges from null prototype objects', () => {

        const a = {} as any;

        const b = Object.create(null);
        b.x = true;

        Hoek.merge(a, b);
        expect(a.x).toBe(true);
    });

    it('skips non-enumerable properties', () => {

        const a = { x: 0 } as any;

        const b = {};
        Object.defineProperty(b, 'x', {
            enumerable: false,
            value: 1
        });

        Hoek.merge(a, b);
        expect(a.x).toHoequal(0);
    });

    it('does not throw if source is null', () => {

        const a = {} as any;
        const b = null;
        let c = null;

        expect(() => {

            c = Hoek.merge(a, b);
        }).not.toThrow();

        expect(c).toHoequal(a);
    });

    it('does not throw if source is undefined', () => {

        const a = {} as any;
        const b = undefined;
        let c = null;

        expect(() => {

            c = Hoek.merge(a, b);
        }).not.toThrow();

        expect(c).toHoequal(a);
    });

    it('throws if source is not an object', () => {

        expect(() => {

            const a = {} as any;
            const b = 0;

            // @ts-expect-error - intentionally invalid
            Hoek.merge(a, b);
        }).toThrow('Invalid source value: must be null, undefined, or an object');
    });

    it('throws if target is not an object', () => {

        expect(() => {

            const a = 0;
            const b = {};

            // @ts-expect-error - intentionally invalid
            Hoek.merge(a, b);
        }).toThrow('Invalid target value: must be an object');
    });

    it('throws if target is not an array and source is', () => {

        expect(() => {

            const a = {} as any;
            const b = [1, 2];

            Hoek.merge(a, b);
        }).toThrow('Cannot merge array onto an object');
    });

    it('returns the same object when merging arrays', () => {

        const a = [] as any[];
        const b = [1, 2];

        expect(Hoek.merge(a, b)).toHoequal(a);
    });

    it('combines an empty object with a non-empty object', () => {

        const a = {} as any;
        const b = nestedObj;

        const c = Hoek.merge(a, b);
        expect(a).toHoequal(b);
        expect(c).toHoequal(b);
    });

    it('overrides values in target', () => {

        const a = { x: 1, y: 2, z: 3, v: 5, t: 'test', s: 1, m: 'abc' };
        const b = { x: null, z: 4, v: 0, t: { u: 6 }, s: undefined, m: '123' };

        const c = Hoek.merge(a, b);
        expect(c.x).toHoequal(null as never);
        expect(c.y).toHoequal(2);
        expect(c.z).toHoequal(4);
        expect(c.v).toHoequal(0);
        expect(c.m).toHoequal('123');
        expect(c.t).toHoequal({ u: 6 });
        expect(c.s).toHoequal(undefined);
    });

    it('overrides values in target (flip)', () => {

        const a = { x: 1, y: 2, z: 3, v: 5, t: 'test', s: 1, m: 'abc' };
        const b = { x: null, z: 4, v: 0, t: { u: 6 }, s: undefined, m: '123' };

        const d = Hoek.merge(b, a);
        expect(d.x).toHoequal(1);
        expect(d.y).toHoequal(2);
        expect(d.z).toHoequal(3);
        expect(d.v).toHoequal(5);
        expect(d.m).toHoequal('abc');
        expect(d.t).toHoequal('test');
        expect(d.s).toHoequal(1);
    });

    it('retains Date properties', () => {

        const a = { x: new Date(1378776452757) };

        const b = Hoek.merge({}, a);
        expect(a.x.getTime()).toHoequal(b.x.getTime());
    });

    it('retains Date properties when merging keys', () => {

        const a = { x: new Date(1378776452757) };

        const b = Hoek.merge({ x: {} }, a);
        expect(a.x.getTime()).toHoequal((b.x as Date).getTime());
    });

    it('overrides Buffer', () => {

        const a = { x: Buffer.from('abc') };

        Hoek.merge({ x: {} }, a);
        expect(a.x.toString()).toHoequal('abc');
    });

    it('overrides RegExp', () => {

        const a = { x: /test/ };

        Hoek.merge({ x: {} }, a);
        expect(a.x).toHoequal(/test/);
    });

    it('overrides Symbol properties', () => {

        const sym = Symbol();
        const a = { [sym]: 1 };

        Hoek.merge({ [sym]: {} }, a);
        expect(a[sym]).toHoequal(1);
    });

    it('skips __proto__', () => {

        const a = '{ "ok": "value", "__proto__": { "test": "value" } }';

        const b = Hoek.merge({}, JSON.parse(a));
        expect(b).toHoequal({ ok: 'value' });
        expect(b.test).toHoequal(undefined);
    });
});

describe('applyToDefaults()', () => {

    it('throws when target is null', () => {

        expect(() => {

            Hoek.applyToDefaults(null as never, {});
        }).toThrow('Invalid defaults value: must be an object');
    });

    it('throws when options are invalid', () => {

        expect(() => {

            Hoek.applyToDefaults({}, {}, false as never);
        }).toThrow('Invalid options: must be an object');

        expect(() => {

            Hoek.applyToDefaults({}, {}, 123 as never);
        }).toThrow('Invalid options: must be an object');
    });

    it('returns null if source is false', () => {

        const defaults = {
            a: 1,
            b: 2,
            c: {
                d: 3,
                e: [5, 6]
            },
            f: 6,
            g: 'test'
        };

        const result = Hoek.applyToDefaults(defaults, false);
        expect(result).toHoequal(null);
    });

    it('returns null if source is null', () => {

        const defaults = {
            a: 1,
            b: 2,
            c: {
                d: 3,
                e: [5, 6]
            },
            f: 6,
            g: 'test'
        };

        const result = Hoek.applyToDefaults(defaults, null as never);
        expect(result).toHoequal(null);
    });

    it('returns null if source is undefined', () => {

        const defaults = {
            a: 1,
            b: 2,
            c: {
                d: 3,
                e: [5, 6]
            },
            f: 6,
            g: 'test'
        };

        const result = Hoek.applyToDefaults(defaults, undefined);
        expect(result).toHoequal(null);
    });

    it('returns a copy of defaults if source is true', () => {

        const defaults = {
            a: 1,
            b: 2,
            c: {
                d: 3,
                e: [5, 6]
            },
            f: 6,
            g: 'test'
        };

        const result = Hoek.applyToDefaults(defaults, true);
        expect(result).toHoequal(defaults);
    });

    it('applies object to defaults', () => {

        const defaults = {
            a: 1,
            b: 2,
            c: {
                d: 3,
                e: [5, 6]
            },
            f: 6,
            g: 'test'
        };

        const obj = {
            a: null,
            c: {
                e: [4]
            },
            f: 0,
            g: {
                h: 5
            }
        };

        type D = MergeTypes<typeof defaults, typeof obj>;

        const result = Hoek.applyToDefaults<D>(defaults, obj)!;
        expect(result.c!.e).toHoequal([4]);
        expect(result.a).toHoequal(1);
        expect(result.b).toHoequal(2);
        expect(result.f).toHoequal(0);
        expect(result.g).toHoequal({ h: 5 });
    });

    it('applies object to defaults with null', () => {

        const defaults = {
            a: 1,
            b: 2,
            c: {
                d: 3,
                e: [5, 6]
            },
            f: 6,
            g: 'test'
        };

        const obj = {
            a: null,
            c: {
                e: [4]
            },
            f: 0,
            g: {
                h: 5
            }
        };

        type D = MergeTypes<typeof defaults, typeof obj>;

        const result = Hoek.applyToDefaults<D>(defaults, obj, { nullOverride: true })!;
        expect(result.c!.e).toHoequal([4]);
        expect(result.a).toHoequal(null);
        expect(result.b).toHoequal(2);
        expect(result.f).toHoequal(0);
        expect(result.g).toHoequal({ h: 5 });
    });

    it('shallow copies the listed keys from source without merging', () => {

        const defaults = {
            a: {
                b: 5,
                e: 3
            },
            c: {
                d: 7,
                g: 1
            }
        };

        const source = {
            a: {
                b: 4
            },
            c: {
                d: 6,
                f: 7
            }
        };

        type D = MergeTypes<typeof defaults, typeof source>;

        const merged = Hoek.applyToDefaults<D>(defaults, source, { shallow: ['a'] })!;
        expect(merged).toHoequal({ a: { b: 4 }, c: { d: 6, g: 1, f: 7 } });
        expect(merged.a).toBe(source.a);
        expect(merged.a).not.toHoequal(defaults.a);
        expect(merged.c).not.toHoequal(source.c);
        expect(merged.c).not.toHoequal(defaults.c);
    });

    it('shallow copies the nested keys (override)', () => {

        const defaults = {
            a: {
                b: 5
            },
            c: {
                d: 7,
                g: 1
            }
        };

        const source = {
            a: {
                b: 4
            },
            c: {
                d: 6,
                g: {
                    h: 8
                }
            }
        };

        type D = MergeTypes<typeof defaults, typeof source>;

        const merged = Hoek.applyToDefaults<D>(defaults, source, { shallow: ['c.g'] })!;
        expect(merged).toHoequal({ a: { b: 4 }, c: { d: 6, g: { h: 8 } } });
        expect(merged.c!.g).toBe(source.c.g);
    });

    it('shallow copies the nested keys (missing)', () => {

        const defaults = {
            a: {
                b: 5
            }
        };

        const source = {
            a: {
                b: 4
            },
            c: {
                g: {
                    h: 8
                }
            }
        };

        type D = MergeTypes<typeof defaults, typeof source>;

        const merged = Hoek.applyToDefaults<D>(defaults, source, { shallow: ['c.g'] })!;
        expect(merged).toHoequal({ a: { b: 4 }, c: { g: { h: 8 } } });
        expect(merged.c!.g).toBe(source.c.g);
    });

    it('shallow copies the nested keys (override)', () => {

        const defaults = {
            a: {
                b: 5
            },
            c: {
                g: {
                    d: 7
                }
            }
        };

        const source = {
            a: {
                b: 4
            },
            c: {
                g: {
                    h: 8
                }
            }
        };

        type D = MergeTypes<typeof defaults, typeof source>;

        const merged = Hoek.applyToDefaults<D>(defaults, source, { shallow: ['c.g'] })!;
        expect(merged).toHoequal({ a: { b: 4 }, c: { g: { h: 8 } } });
        expect(merged.c!.g).toBe(source.c.g);
    });

    it('shallow copies the nested keys (deeper)', () => {

        const defaults = {
            a: {
                b: 5
            }
        };

        const source = {
            a: {
                b: 4
            },
            c: {
                g: {
                    r: {
                        h: 8
                    }
                }
            }
        };

        type D = MergeTypes<typeof defaults, typeof source>;

        const merged = Hoek.applyToDefaults<D>(defaults, source, { shallow: ['c.g.r'] })!;
        expect(merged).toHoequal({ a: { b: 4 }, c: { g: { r: { h: 8 } } } });
        expect(merged.c!.g.r).toBe(source.c.g.r);
    });

    it('shallow copies the nested keys (not present)', () => {

        const defaults = {
            a: {
                b: 5
            }
        };

        const source = {
            a: {
                b: 4
            },
            c: {
                g: {
                    r: {
                        h: 8
                    }
                }
            }
        };

        type D = MergeTypes<typeof defaults, typeof source>;

        const merged = Hoek.applyToDefaults<D>(defaults, source, { shallow: ['x.y'] });
        expect(merged).toHoequal({ a: { b: 4 }, c: { g: { r: { h: 8 } } } });
    });

    it('shallow copies the nested keys (non-object)', () => {

        const defaults = {
            // All falsy values:
            _undefined: {
                a: 1
            },
            _null: {
                a: 2
            },
            _false: {
                a: 3
            },
            _emptyString: {
                a: 4
            },
            _zero: {
                a: 5
            },
            _NaN: {
                a: 6
            },
            // Other non-object values:
            _string: {
                a: 7
            },
            _number: {
                a: 8
            },
            _true: {
                a: 9
            },
            _function: {
                a: 10
            }
        };

        const source = {
            _undefined: undefined,
            _null: null,
            _false: false,
            _emptyString: '',
            _zero: 0,
            _NaN: NaN,
            _string: 'foo',
            _number: 42,
            _true: true,
            _function: () => {}
        };

        type D = MergeTypes<typeof defaults, typeof source>;

        const merged = Hoek.applyToDefaults<D>(defaults, source, { shallow: [
            '_undefined.a',
            '_null.a',
            '_false.a',
            '_emptyString.a',
            '_zero.a',
            '_NaN.a',
            '_string.a',
            '_number.a',
            '_true.a',
            '_function.a'
        ] });
        expect(merged).toHoequal({
            _undefined: { a: 1 },
            _null: { a: 2 },
            _false: false,
            _emptyString: '',
            _zero: 0,
            _NaN: NaN,
            _string: 'foo',
            _number: 42,
            _true: true,
            _function: source._function
        });
    });

    it('shallow copies the listed keys in the defaults', () => {

        const defaults = {
            a: {
                b: 1
            }
        };

        const merged = Hoek.applyToDefaults(defaults, {}, { shallow: ['a'] })!;
        expect(merged.a).toBe(defaults.a);
    });

    it('shallow copies the listed keys in the defaults (true)', () => {

        const defaults = {
            a: {
                b: 1
            }
        };

        const merged = Hoek.applyToDefaults(defaults, true, { shallow: ['a'] })!;
        expect(merged.a).toBe(defaults.a);
    });

    it('returns null on false', () => {

        const defaults = {
            a: {
                b: 1
            }
        };

        const merged = Hoek.applyToDefaults(defaults, false, { shallow: ['a'] });
        expect(merged).toHoequal(null);
    });

    it('handles missing shallow key in defaults', () => {

        const defaults = {
            a: {
                b: 1
            }
        };

        const options = {
            a: {
                b: 4
            },
            c: {
                d: 2
            }
        };

        type D = MergeTypes<typeof defaults, typeof options>;


        const merged = Hoek.applyToDefaults<D>(defaults, options, { shallow: ['c'] })!;
        expect(merged).toHoequal({ a: { b: 4 }, c: { d: 2 } });
        expect(merged.c).toBe(options.c);

        expect(Hoek.applyToDefaults(defaults, true, { shallow: ['c'] })).toHoequal({ a: { b: 1 } });
    });

    it('throws on missing defaults', () => {

        expect(() => Hoek.applyToDefaults(null as never, {}, { shallow: ['a'] })).toThrow('Invalid defaults value: must be an object');
    });

    it('throws on invalid defaults', () => {

        expect(() => Hoek.applyToDefaults('abc', {}, { shallow: ['a'] })).toThrow('Invalid defaults value: must be an object');
    });

    it('throws on invalid source', () => {

        expect(() => Hoek.applyToDefaults({}, 'abc', { shallow: ['a'] })).toThrow('Invalid source value: must be true, falsy or an object');
    });

    it('throws on missing keys', () => {

        expect(() => Hoek.applyToDefaults({}, true, { shallow: 123 } as never)).toThrow('Invalid keys');
    });

    it('handles array keys', () => {

        const sym = Symbol();

        const defaults = {
            a: {
                b: 5,
                e: 3
            },
            c: {
                d: 7,
                [sym]: {
                    f: 9
                }
            }
        };

        const options = {
            a: {
                b: 4
            },
            c: {
                d: 6,
                [sym]: {
                    g: 1
                }
            }
        };

        type D = MergeTypes<typeof defaults, typeof options>;

        const merged = Hoek.applyToDefaults<D>(defaults, options, { shallow: [['c', sym]] })!;
        expect(merged).toHoequal({ a: { b: 4, e: 3 }, c: { d: 6, [sym]: { g: 1 } } });
        expect(merged.c![sym]).toBe(options.c[sym]);
    });

    it('does not modify shallow entries in source', () => {

        const defaults = {
            a: {
                b: 5
            }
        };

        const source = {} as { a?: { b: number } };

        Object.defineProperty(source, 'a', { value: { b: 4 } });

        type D = MergeTypes<typeof defaults, typeof source>;

        const merged = Hoek.applyToDefaults<D>(defaults, source, { shallow: ['a'] })!;
        expect(merged).toHoequal({ a: { b: 4 } });
        expect(merged.a).toBe(source.a);
        expect(merged.a).not.toHoequal(defaults.a);
    });

    it('should respect nullOverride when shallow is used', () => {

        const defaults = { host: 'localhost', port: 8000 };
        const source = { host: null, port: 8080 };

        type D = MergeTypes<typeof defaults, typeof source>;

        const result = Hoek.applyToDefaults<D>(defaults, source, { nullOverride: true, shallow: [] })!;
        expect(result.host).toHoequal(null);
        expect(result.port).toHoequal(8080);
    });
});

describe('deepEqual()', () => {

    it('compares identical references', () => {

        const x = {};

        expect(Hoek.deepEqual(x, x)).toBe(true);
    });

    it('compares simple values', () => {

        expect(Hoek.deepEqual('x', 'x')).toBe(true);
        expect(Hoek.deepEqual('x', 'y')).toBe(false);
        expect(Hoek.deepEqual('x1', 'x')).toBe(false);
        expect(Hoek.deepEqual(-0, +0)).toBe(false);
        expect(Hoek.deepEqual(-0, -0)).toBe(true);
        expect(Hoek.deepEqual(+0, +0)).toBe(true);
        expect(Hoek.deepEqual(+0, -0)).toBe(false);
        expect(Hoek.deepEqual(1, 1)).toBe(true);
        expect(Hoek.deepEqual(0, 0)).toBe(true);
        expect(Hoek.deepEqual(-1, 1)).toBe(false);
        expect(Hoek.deepEqual(NaN, 0)).toBe(false);
        expect(Hoek.deepEqual(NaN, NaN)).toBe(true);
    });

    it('compares different types', () => {

        expect(Hoek.deepEqual([], 5, { prototype: false })).toBe(false);
        expect(Hoek.deepEqual(5, [], { prototype: false })).toBe(false);
        expect(Hoek.deepEqual({}, null, { prototype: false })).toBe(false);
        expect(Hoek.deepEqual(null, {}, { prototype: false })).toBe(false);
        expect(Hoek.deepEqual('abc', {}, { prototype: false })).toBe(false);
        expect(Hoek.deepEqual({}, 'abc', { prototype: false })).toBe(false);
    });

    it('compares empty structures', () => {

        expect(Hoek.deepEqual([], [])).toBe(true);
        expect(Hoek.deepEqual({}, {})).toBe(true);
        expect(Hoek.deepEqual([], {})).toBe(false);
        expect(Hoek.deepEqual([], {}, { prototype: false })).toBe(false);
        expect(Hoek.deepEqual({}, [], { prototype: false })).toBe(false);
    });

    it('compares empty arguments object', () => {

        const compare = function () {

            expect(Hoek.deepEqual([], arguments)).toBe(false);            // eslint-disable-line prefer-rest-params
        };

        compare();
    });

    it('compares empty arguments objects', () => {

        const compare = function () {

            const arg1 = arguments;                                         // eslint-disable-line prefer-rest-params

            const inner = function () {

                // callee is not supported in strict mode, was previously false becuse callee was different
                expect(Hoek.deepEqual(arg1, arguments)).toBe(true);       // eslint-disable-line prefer-rest-params
            };

            inner();
        };

        compare();
    });

    it('compares symbol object properties', () => {

        const sym = Symbol();

        const ne = {};
        Object.defineProperty(ne, sym, { value: true });

        expect(Hoek.deepEqual({ [sym]: { c: true } }, { [sym]: { c: true } })).toBe(true);
        expect(Hoek.deepEqual({ [sym]: { c: true } }, { [sym]: { c: false } })).toBe(false);
        expect(Hoek.deepEqual({ [sym]: { c: true } }, { [sym]: true })).toBe(false);
        expect(Hoek.deepEqual({ [sym]: undefined }, { [sym]: undefined })).toBe(true);
        expect(Hoek.deepEqual({ [sym]: undefined }, {})).toBe(false);
        expect(Hoek.deepEqual({}, { [sym]: undefined })).toBe(false);

        expect(Hoek.deepEqual({}, ne)).toBe(true);
        expect(Hoek.deepEqual(ne, {})).toBe(true);
        expect(Hoek.deepEqual({ [sym]: true }, ne)).toBe(false);
        expect(Hoek.deepEqual(ne, { [sym]: true })).toBe(false);
        expect(Hoek.deepEqual(ne, { [Symbol()]: undefined })).toBe(false);

        expect(Hoek.deepEqual({ [sym]: true }, { [sym]: true })).toBe(true);
        expect(Hoek.deepEqual({ [sym]: true }, {})).toBe(false);
        expect(Hoek.deepEqual({ [sym]: true }, {}, { symbols: false })).toBe(true);
    });

    it('compares dates', () => {

        expect(Hoek.deepEqual(new Date(2015, 1, 1), new Date('2015/02/01'))).toBe(true);
        expect(Hoek.deepEqual(new Date(100), new Date(101))).toBe(false);
        expect(Hoek.deepEqual(new Date(), {})).toBe(false);
        expect(Hoek.deepEqual(new Date(2015, 1, 1), new Date('2015/02/01'), { prototype: false })).toBe(true);
        expect(Hoek.deepEqual(new Date(), {}, { prototype: false })).toBe(false);
        expect(Hoek.deepEqual({}, new Date(), { prototype: false })).toBe(false);
    });

    it('compares regular expressions', () => {

        expect(Hoek.deepEqual(/\s/, new RegExp('\\\s'))).toBe(true);
        expect(Hoek.deepEqual(/\s/g, /\s/g)).toBe(true);
        expect(Hoek.deepEqual(/a/, {}, { prototype: false })).toBe(false);
        expect(Hoek.deepEqual(/\s/g, /\s/i)).toBe(false);
        expect(Hoek.deepEqual(/a/g, /b/g)).toBe(false);
    });

    it('compares errors', () => {

        expect(Hoek.deepEqual(new Error('a'), new Error('a'))).toBe(true);
        expect(Hoek.deepEqual(new Error('a'), new Error('b'))).toBe(false);

        expect(Hoek.deepEqual(new Error('a'), new TypeError('a'))).toBe(false);
        expect(Hoek.deepEqual(new Error('a'), new TypeError('a'), { prototype: false })).toBe(false);

        expect(Hoek.deepEqual(new Error(), {})).toBe(false);
        expect(Hoek.deepEqual(new Error(), {}, { prototype: false })).toBe(false);

        expect(Hoek.deepEqual({}, new Error())).toBe(false);
        expect(Hoek.deepEqual({}, new Error(), { prototype: false })).toBe(false);

        const error = new Error('a');
        expect(Hoek.deepEqual(Hoek.clone(error), error)).toBe(true);
        expect(Hoek.deepEqual(Hoek.clone(error), error, { prototype: false })).toBe(true);
    });

    it('compares arrays', () => {

        expect(Hoek.deepEqual([[1]], [[1]])).toBe(true);
        expect(Hoek.deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
        expect(Hoek.deepEqual([1, 2, 3], [1, 3, 2])).toBe(false);
        expect(Hoek.deepEqual([1, 2, 3], [1, 2])).toBe(false);
        expect(Hoek.deepEqual([1], [1])).toBe(true);
        const item1 = { key: 'value1' };
        const item2 = { key: 'value2' };
        expect(Hoek.deepEqual([item1, item1], [item1, item2])).toBe(false);
    });

    it('compares sets', () => {

        expect(Hoek.deepEqual(new Set(), new Set())).toBe(true);
        expect(Hoek.deepEqual(new Set([1]), new Set([1]))).toBe(true);
        expect(Hoek.deepEqual(new Set([]), new Set([]))).toBe(true);
        expect(Hoek.deepEqual(new Set([1, 2, 3]), new Set([1, 2, 3]))).toBe(true);
        expect(Hoek.deepEqual(new Set([1, 2, 3]), new Set([3, 2, 1]))).toBe(true);
        expect(Hoek.deepEqual(new Set([1, 2, 3]), new Set([1, 2, 4]))).toBe(false);
        expect(Hoek.deepEqual(new Set([1, 2, 3]), new Set([1, 2]))).toBe(false);
        expect(Hoek.deepEqual(new Set([1, 2, 1]), new Set([1, 2]))).toBe(true);
        expect(Hoek.deepEqual(new Set([+0]), new Set([-0]))).toBe(true);
        expect(Hoek.deepEqual(new Set([NaN]), new Set([NaN]))).toBe(true);
        expect(Hoek.deepEqual(new Set([1, {}]), new Set([1, {}]))).toBe(true);
        expect(Hoek.deepEqual(new Set([1, {}]), new Set([{}, 1]))).toBe(true);
        expect(Hoek.deepEqual(new Set([1, {}, {}]), new Set([{}, 1, {}]))).toBe(true);
        expect(Hoek.deepEqual(new Set([1, { a: 1 }]), new Set([{ a: 0 }, 1]))).toBe(false);
        expect(Hoek.deepEqual(new WeakSet(), new WeakSet())).toBe(true);
        const obj = {};
        expect(Hoek.deepEqual(new WeakSet([obj]), new WeakSet())).toBe(true);
        expect(Hoek.deepEqual(new WeakSet(), new Set(), { prototype: false })).toBe(false);

        const sets = [new Set(), new Set()].map((set) => {

            (set as any).modified = true;
            return set;
        });
        expect(Hoek.deepEqual(sets[0], sets[1])).toBe(true);
        expect(Hoek.deepEqual(sets[0], new Set())).toBe(false);
    });

    it('compares extended sets', () => {

        class PrivateSet extends Set {

            has(): boolean {

                throw new Error('not allowed');
            }
        }

        const entries = ['a', undefined];
        expect(Hoek.deepEqual(new PrivateSet(), new PrivateSet())).toBe(true);
        expect(Hoek.deepEqual(new PrivateSet(entries), new PrivateSet(entries))).toBe(true);
        expect(Hoek.deepEqual(new PrivateSet(entries), new Set(entries), { prototype: false })).toBe(true);
        expect(Hoek.deepEqual(new PrivateSet(entries), new Set(entries), { prototype: true })).toBe(false);
        expect(Hoek.deepEqual(new PrivateSet(), new PrivateSet(entries))).toBe(false);
        expect(Hoek.deepEqual(new PrivateSet(entries), new PrivateSet())).toBe(false);

        class LockableSet extends Set {

            locked: boolean;

            constructor(values?: any[], locked = true) {

                super(values);
                this.locked = locked;
            }

            has(key: any) {

                if (this.locked) {
                    throw new Error('not allowed');
                }

                return super.has(key);
            }
        }

        expect(Hoek.deepEqual(new LockableSet(), new LockableSet())).toBe(true);
        expect(Hoek.deepEqual(new LockableSet(entries), new LockableSet(entries))).toBe(true);
        expect(Hoek.deepEqual(new LockableSet(entries, false), new LockableSet(entries, false))).toBe(true);
        expect(Hoek.deepEqual(new LockableSet(entries, true), new LockableSet(entries, false))).toBe(false);
        expect(Hoek.deepEqual(new LockableSet(entries, false), new LockableSet(entries, true))).toBe(false);
        expect(Hoek.deepEqual(new LockableSet(entries), new Set(entries), { prototype: false })).toBe(false);
        expect(Hoek.deepEqual(new LockableSet(entries), new PrivateSet(entries), { prototype: false })).toBe(false);
    });

    it('compares maps', () => {

        const item1 = { key: 'value1' };
        const item2 = { key: 'value2' };
        expect(Hoek.deepEqual(new Map(), new Map())).toBe(true);
        expect(Hoek.deepEqual(new Map([[1, {}]]), new Map([[1, {}]]))).toBe(true);
        expect(Hoek.deepEqual(new Map([[1, item1]]), new Map([[1, item1]]))).toBe(true);
        expect(Hoek.deepEqual(new Map([[1, item1]]), new Map([[1, item2]]))).toBe(false);
        expect(Hoek.deepEqual(new Map([[1, undefined]]), new Map([[1, undefined]]))).toBe(true);
        expect(Hoek.deepEqual(new Map([[1, undefined]]), new Map([[2, undefined]]))).toBe(false);
        expect(Hoek.deepEqual(new Map([[1, {}]]), new Map([[1, {}], [2, {}]]))).toBe(false);
        expect(Hoek.deepEqual(new Map([[item1, 1]]), new Map([[item1, 1]]))).toBe(true);
        expect(Hoek.deepEqual(new Map([[{}, 1]]), new Map([[{}, 1]]))).toBe(false);
        expect(Hoek.deepEqual(new WeakMap(), new WeakMap())).toBe(true);
        expect(Hoek.deepEqual(new WeakMap([[item1, 1]]), new WeakMap())).toBe(true);
        expect(Hoek.deepEqual(new WeakMap(), new Map(), { prototype: false })).toBe(false);

        const maps = [new Map(), new Map()].map((map) => {

            (map as any).modified = true;
            return map;
        });
        expect(Hoek.deepEqual(maps[0], maps[1])).toBe(true);
        expect(Hoek.deepEqual(maps[0], new Map())).toBe(false);
    });

    it('compares extended maps', () => {

        class PrivateMap extends Map {

            constructor(args?: any) {

                // @ts-expect-error - Map typing is a MapConstructor, but for whatever reason, it thinks it doesn't accept arguments
                super(args);
            }

            get() {

                throw new Error('not allowed');
            }
        }

        const entries = [['a', 1], ['b', undefined]] as const;

        expect(Hoek.deepEqual(new PrivateMap(), new PrivateMap())).toBe(true);
        expect(Hoek.deepEqual(new PrivateMap(entries), new PrivateMap(entries))).toBe(true);
        expect(Hoek.deepEqual(new PrivateMap(entries), new Map(entries), { prototype: false })).toBe(true);
        expect(Hoek.deepEqual(new PrivateMap(entries), new Map(entries), { prototype: true })).toBe(false);
        expect(Hoek.deepEqual(new PrivateMap(), new PrivateMap(entries))).toBe(false);
        expect(Hoek.deepEqual(new PrivateMap(entries), new PrivateMap())).toBe(false);

        class LockableMap extends Map {

            locked: boolean;

            constructor(kvs?: any, locked = true) {

                // https://stackoverflow.com/questions/70677360/in-typescript-when-i-use-mymap-to-extends-map-but-it-s-show-expected-0-argument
                // https://stackoverflow.com/questions/67631458/no-overload-matches-this-call-while-constructing-map-from-array
                // @ts-expect-error - See above
                super(kvs);

                this.locked = locked;
            }

            get() {

                if (this.locked) {
                    throw new Error('not allowed');
                }
            }
        }

        expect(Hoek.deepEqual(new LockableMap(), new LockableMap())).toBe(true);
        expect(Hoek.deepEqual(new LockableMap(entries), new LockableMap(entries))).toBe(true);
        expect(Hoek.deepEqual(new LockableMap(entries, false), new LockableMap(entries, false))).toBe(true);
        expect(Hoek.deepEqual(new LockableMap(entries, true), new LockableMap(entries, false))).toBe(false);
        expect(Hoek.deepEqual(new LockableMap(entries, false), new LockableMap(entries, true))).toBe(false);
        expect(Hoek.deepEqual(new LockableMap(entries), new Map(entries), { prototype: false })).toBe(false);
        expect(Hoek.deepEqual(new LockableMap(entries), new PrivateMap(entries), { prototype: false })).toBe(false);
    });

    it('compares promises', () => {

        const a = new Promise(() => { });

        expect(Hoek.deepEqual(a, a)).toBe(true);
        expect(Hoek.deepEqual(a, new Promise(() => { }))).toBe(false);
    });

    it('compares urls', () => {

        const a = new URL('https://hapi.dev/');

        expect(Hoek.deepEqual(a, a)).toBe(true);
        expect(Hoek.deepEqual(a, new URL('https://hapi.dev/?new'))).toBe(false);
        expect(Hoek.deepEqual(a, {}, { prototype: false })).toBe(false);
    });

    it('compares buffers', () => {

        expect(Hoek.deepEqual(Buffer.from([1, 2, 3]), Buffer.from([1, 2, 3]))).toBe(true);
        expect(Hoek.deepEqual(Buffer.from([1, 2, 3]), Buffer.from([1, 3, 2]))).toBe(false);
        expect(Hoek.deepEqual(Buffer.from([1, 2, 3]), Buffer.from([1, 2]))).toBe(false);
        expect(Hoek.deepEqual(Buffer.from([1, 2, 3]), {})).toBe(false);
        expect(Hoek.deepEqual(Buffer.from([1, 2, 3]), [1, 2, 3])).toBe(false);
    });

    it('compares string objects', () => {

        /* eslint-disable no-new-wrappers */
        expect(Hoek.deepEqual(new String('a'), new String('a'))).toBe(true);
        expect(Hoek.deepEqual(new String('a'), new String('b'))).toBe(false);
        expect(Hoek.deepEqual(new String(''), {}, { prototype: false })).toBe(false);
        expect(Hoek.deepEqual({}, new String(''), { prototype: false })).toBe(false);
        expect(Hoek.deepEqual(new String('a'), 'a', { prototype: false })).toBe(false);
        expect(Hoek.deepEqual('a', new String('a'), { prototype: false })).toBe(false);
        /* eslint-enable no-new-wrappers */
    });

    it('compares number objects', () => {

        /* eslint-disable no-new-wrappers */
        expect(Hoek.deepEqual(new Number(1), new Number(1))).toBe(true);
        expect(Hoek.deepEqual(new Number(1), new Number(2))).toBe(false);
        expect(Hoek.deepEqual(new Number(+0), new Number(-0))).toBe(false);
        expect(Hoek.deepEqual(new Number(NaN), new Number(NaN))).toBe(true);
        expect(Hoek.deepEqual(new Number(0), {}, { prototype: false })).toBe(false);
        expect(Hoek.deepEqual({}, new Number(0), { prototype: false })).toBe(false);
        expect(Hoek.deepEqual(new Number(1), 1, { prototype: false })).toBe(false);
        expect(Hoek.deepEqual(1, new Number(1), { prototype: false })).toBe(false);
        /* eslint-enable no-new-wrappers */
    });

    it('compares boolean objects', () => {

        /* eslint-disable no-new-wrappers */
        expect(Hoek.deepEqual(new Boolean(true), new Boolean(true))).toBe(true);
        expect(Hoek.deepEqual(new Boolean(true), new Boolean(false))).toBe(false);
        expect(Hoek.deepEqual(new Boolean(false), {}, { prototype: false })).toBe(false);
        expect(Hoek.deepEqual({}, new Boolean(false), { prototype: false })).toBe(false);
        expect(Hoek.deepEqual(new Boolean(true), true, { prototype: false })).toBe(false);
        expect(Hoek.deepEqual(true, new Boolean(true), { prototype: false })).toBe(false);
        /* eslint-enable no-new-wrappers */
    });

    it('compares objects', () => {

        expect(Hoek.deepEqual({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 })).toBe(true);
        expect(Hoek.deepEqual({ foo: 'bar' }, { foo: 'baz' })).toBe(false);
        expect(Hoek.deepEqual({ foo: { bar: 'foo' } }, { foo: { bar: 'baz' } })).toBe(false);
        expect(Hoek.deepEqual({ foo: undefined }, {})).toBe(false);
        expect(Hoek.deepEqual({}, { foo: undefined })).toBe(false);
        expect(Hoek.deepEqual({ foo: undefined }, { bar: undefined })).toBe(false);
    });

    it('compares functions', () => {

        const f1 = () => 1;
        const f2 = () => 2;
        const f2a = () => 2;

        expect(Hoek.deepEqual({ f1 }, { f1 })).toBe(true);
        expect(Hoek.deepEqual({ f1 }, { f1: f2 })).toBe(false);
        expect(Hoek.deepEqual({ f2 }, { f2: f2a })).toBe(false);
        expect(Hoek.deepEqual({ f2 }, { f2: f2a }, { deepFunction: true })).toBe(true);
        expect(Hoek.deepEqual({ f2 }, { f2: f1 }, { deepFunction: true })).toBe(false);

        const f3 = () => 3;
        f3.x = 1;

        const f3a = () => 3;
        f3a.x = 1;

        const f3b = () => 3;
        f3b.x = 2;

        expect(Hoek.deepEqual({ f3 }, { f3: f3a }, { deepFunction: true })).toBe(true);
        expect(Hoek.deepEqual({ f3 }, { f3: f3b }, { deepFunction: true })).toBe(false);
    });

    it('skips keys', () => {

        expect(Hoek.deepEqual({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 4 })).toBe(false);
        expect(Hoek.deepEqual({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 4 }, { skip: ['c'] })).toBe(true);

        expect(Hoek.deepEqual({ a: 1, b: 2, c: 3 }, { a: 1, b: 2 })).toBe(false);
        expect(Hoek.deepEqual({ a: 1, b: 2, c: 3 }, { a: 1, b: 2 }, { skip: ['c'] })).toBe(true);

        const sym = Symbol('test');
        expect(Hoek.deepEqual({ a: 1, b: 2, [sym]: 3 }, { a: 1, b: 2, [sym]: 4 })).toBe(false);
        expect(Hoek.deepEqual({ a: 1, b: 2, [sym]: 3 }, { a: 1, b: 2, [sym]: 4 }, { skip: [sym] })).toBe(true);

        expect(Hoek.deepEqual({ a: 1, b: 2, [sym]: 3 }, { a: 1, b: 2 })).toBe(false);
        expect(Hoek.deepEqual({ a: 1, b: 2, [sym]: 3 }, { a: 1, b: 2 }, { skip: [sym] })).toBe(true);
        expect(Hoek.deepEqual({ a: 1, b: 2, [sym]: 3, [Symbol('other')]: true }, { a: 1, b: 2 }, { skip: [sym] })).toBe(false);

        expect(Hoek.deepEqual({ a: 1, b: 2 }, { a: 1 }, { skip: ['a'] })).toBe(false);
        expect(Hoek.deepEqual({ a: 1 }, { a: 1, b: 2 }, { skip: ['a'] })).toBe(false);
    });

    it('handles circular dependency', () => {

        const a = {} as any;
        a.x = a;

        const b = Hoek.clone(a);
        expect(Hoek.deepEqual(a, b)).toBe(true);
    });

    it('handles obj only circular dependency', () => {

        const a = {} as any;
        a.x = a;

        const b = { x: {} };
        expect(Hoek.deepEqual(a, b)).toBe(false);
        expect(Hoek.deepEqual(b, a)).toBe(false);
    });

    it('handles irregular circular dependency', () => {

        const a = {} as any;
        a.x = a;

        const b = { x: {} } as any;

        b.x.x = b;

        const c = { x: { x: {} } } as any;
        c.x.x.x = c;

        expect(Hoek.deepEqual(a, b)).toBe(true);
        expect(Hoek.deepEqual(b, a)).toBe(true);
        expect(Hoek.deepEqual(a, c)).toBe(true);
        expect(Hoek.deepEqual(b, c)).toBe(true);
        expect(Hoek.deepEqual(c, a)).toBe(true);
        expect(Hoek.deepEqual(c, b)).toBe(true);

        b.x.y = 1;

        expect(Hoek.deepEqual(a, b)).toBe(false);
        expect(Hoek.deepEqual(b, a)).toBe(false);
    });

    it('handles cross circular dependency', () => {

        const a = {} as any;
        const b = { x: {}, y: a } as any;

        b.x.x = b;
        b.x.y = b.x;
        a.x = b;
        a.y = a;

        expect(Hoek.deepEqual(b, a)).toBe(true);
        expect(Hoek.deepEqual(a, b)).toBe(true);

        b.x.y = 1;

        expect(Hoek.deepEqual(b, a)).toBe(false);
        expect(Hoek.deepEqual(a, b)).toBe(false);
    });

    it('handles reuse of objects', () => {

        const date1 = { year: 2018, month: 1, day: 1 };
        const date2 = { year: 2000, month: 1, day: 1 };

        expect(Hoek.deepEqual({ start: date1, end: date1 }, { start: date1, end: date2 })).toBe(false);
    });

    it('handles valueOf() that throws', () => {

        const throwing = class {

            value: string;

            constructor(value: string) {

                this.value = value;
            }

            valueOf() {

                throw new Error('failed');
            }
        };

        expect(Hoek.deepEqual(new throwing('a'), new throwing('a'))).toBe(true);
        expect(Hoek.deepEqual(new throwing('a'), new throwing('b'))).toBe(false);
        expect(Hoek.deepEqual(new throwing('a'), { value: 'a' }, { prototype: false })).toBe(false);
        expect(Hoek.deepEqual({ value: 'a' }, new throwing('a'), { prototype: false })).toBe(false);
    });

    it('handles valueOf() that returns similar value', () => {

        const identity = class {

            value: string;

            constructor(value: string) {

                this.value = value;
            }

            valueOf() {

                return { value: this.value };
            }
        };

        expect(Hoek.deepEqual(new identity('a'), new identity('a'))).toBe(true);
        expect(Hoek.deepEqual(new identity('a'), new identity('b'))).toBe(false);
        expect(Hoek.deepEqual(new identity('a'), { value: 'a' }, { prototype: true })).toBe(false);
        expect(Hoek.deepEqual(new identity('a'), { value: 'a' }, { prototype: false })).toBe(true);
        expect(Hoek.deepEqual({ value: 'a' }, new identity('a'), { prototype: true })).toBe(false);
        expect(Hoek.deepEqual({ value: 'a' }, new identity('a'), { prototype: false })).toBe(true);
    });


    interface BaseItf {
        value: string;
        surprice?: number;
    }

    it('skips enumerable properties on prototype chain', () => {

        const base: any = function (
            this: BaseItf,
            value: string,
            surprice?: number
        ) {

            this.value = value;

            if (surprice) {
                this.surprice = surprice;
            }
        } as any;

        Object.defineProperty(base.prototype, 'enum', {
            enumerable: true,
            configurable: true,
            value: true
        });

        expect('enum' in new base('a')).toBe(true);
        expect(Hoek.deepEqual(new base('a'), new base('a'))).toBe(true);
        expect(Hoek.deepEqual(new base('a'), new base('b'))).toBe(false);
        expect(Hoek.deepEqual(new base('a'), { value: 'a' }, { prototype: false })).toBe(true);
        expect(Hoek.deepEqual({ value: 'a' }, new base('a'), { prototype: false })).toBe(true);
        expect(Hoek.deepEqual(new base('a', 1), { value: 'a', enum: true }, { prototype: false })).toBe(false);
        expect(Hoek.deepEqual({ value: 'a', enum: true }, new base('a', 1), { prototype: false })).toBe(false);
    });

    it('skips non-enumerable properties', () => {

        const base: any = function Base(
            this: BaseItf,
            value: string,
            surprice: number
        ) {

            this.value = value;

            if (surprice) {
                this.surprice = surprice;
            }
        };

        const createObj = (...args: any[]) => {

            const obj = new base(...args);

            Object.defineProperty(obj, 'hidden', {
                enumerable: false,
                configurable: true,
                value: true
            });

            return obj;
        };

        expect(Hoek.deepEqual(createObj('a'), createObj('a'))).toBe(true);
        expect(Hoek.deepEqual(createObj('a'), createObj('b'))).toBe(false);
        expect(Hoek.deepEqual(createObj('a'), { value: 'a' }, { prototype: false })).toBe(true);
        expect(Hoek.deepEqual({ value: 'a' }, createObj('a'), { prototype: false })).toBe(true);
        expect(Hoek.deepEqual(createObj('a', 1), { value: 'a', hidden: true }, { prototype: false })).toBe(false);
        expect(Hoek.deepEqual({ value: 'a', hidden: true }, createObj('a', 1), { prototype: false })).toBe(false);
    });

    it('compares an object with property getter while executing it', () => {

        const obj = {} as any;
        const value = 1;
        let execCount = 0;

        Object.defineProperty(obj, 'test', {
            enumerable: true,
            configurable: true,
            get: function () {

                ++execCount;
                return value;
            }
        });

        const copy = Hoek.clone(obj);

        expect(Hoek.deepEqual(obj, copy)).toBe(true);
        expect(execCount).toHoequal(2);
        expect(copy.test).toHoequal(1);
        expect(execCount).toHoequal(3);
    });

    it('compares objects with property getters', () => {

        const obj = {};
        const ref = {};

        Object.defineProperty(obj, 'test', {
            enumerable: true,
            configurable: true,
            get: function () {

                return 1;
            }
        });

        Object.defineProperty(ref, 'test', {
            enumerable: true,
            configurable: true,
            get: function () {

                return 2;
            }
        });

        expect(Hoek.deepEqual(obj, ref)).toBe(false);
    });

    it('compares object prototypes', () => {

        interface Itf {
            a: number,
        }

        const Obj: any = function (this: Itf) {

            this.a = 5;
        };

        Obj.prototype.b = function () {

            return this.a;
        };

        const Ref: any = function (this: Itf) {

            this.a = 5;
        };

        Ref.prototype.b = function () {

            return this.a;
        };

        expect(Hoek.deepEqual(new Obj(), new Ref())).toBe(false);
        expect(Hoek.deepEqual(new Obj(), new Obj())).toBe(true);
        expect(Hoek.deepEqual(new Ref(), new Ref())).toBe(true);
    });

    it('compares plain objects', () => {

        const a = Object.create(null);
        const b = Object.create(null);

        a.b = 'c';
        b.b = 'c';

        expect(Hoek.deepEqual(a, b)).toBe(true);
        expect(Hoek.deepEqual(a, { b: 'c' })).toBe(false);
    });

    it('compares an object with an empty object', () => {

        const a = { a: 1, b: 2 };

        expect(Hoek.deepEqual({}, a)).toBe(false);
        expect(Hoek.deepEqual(a, {})).toBe(false);
    });

    it('compares an object ignoring the prototype', () => {

        const a = Object.create(null);
        const b = {};

        expect(Hoek.deepEqual(a, b, { prototype: false })).toBe(true);
    });

    it('compares an object ignoring the prototype recursively', () => {

        const a = [Object.create(null)];
        const b = [{}];

        expect(Hoek.deepEqual(a, b, { prototype: false })).toBe(true);
    });
});

describe('intersect()', () => {

    it('returns the common objects of two arrays', () => {

        const array1 = [1, 2, 3, 4, 4, 5, 5];
        const array2 = [5, 4, 5, 6, 7];
        const common = Hoek.intersect(array1, array2);
        expect(common).toHoequal([5, 4]);
    });

    it('returns the common objects of array and set', () => {

        const array1 = new Set([1, 2, 3, 4, 4, 5, 5]);
        const array2 = [5, 4, 5, 6, 7];
        const common = Hoek.intersect(array1, array2);
        expect(common).toHoequal([5, 4]);
    });

    it('returns the common objects of set and array', () => {

        const array1 = [1, 2, 3, 4, 4, 5, 5];
        const array2 = new Set([5, 4, 5, 6, 7]);
        const common = Hoek.intersect(array1, array2);
        expect(common).toHoequal([5, 4]);
    });

    it('returns the common objects of two sets', () => {

        const array1 = new Set([1, 2, 3, 4, 4, 5, 5]);
        const array2 = new Set([5, 4, 5, 6, 7]);
        const common = Hoek.intersect(array1, array2);
        expect(common).toHoequal([5, 4]);
    });

    it('returns just the first common object of two arrays', () => {

        const array1 = [1, 2, 3, 4, 4, 5, 5];
        const array2 = [5, 4, 5, 6, 7];
        const common = Hoek.intersect(array1, array2, { first: true });
        expect(common).toHoequal(5);
    });

    it('returns null when no common and returning just the first common object of two arrays', () => {

        const array1 = [1, 2, 3, 4, 4, 5, 5];
        const array2 = [6, 7];
        const common = Hoek.intersect(array1, array2, { first: true });
        expect(common).toHoequal(null);
    });

    it('returns an empty array if either input is null', () => {

        expect(Hoek.intersect([1], null)!.length).toHoequal(0);
        expect(Hoek.intersect(null, [1])!.length).toHoequal(0);
        expect(Hoek.intersect(null, [1], { first: true })).toBeNull();
    });

    it('returns the common objects of object and array', () => {

        const array1 = { 1: true, 2: true, 3: true, 4: true, 5: true };
        const array2 = [5, 4, 5, 6, 7];
        const common = Hoek.intersect(array1, array2) as number[];
        expect(common.length).toHoequal(2);
    });
});

describe('contain()', () => {

    it('tests strings', () => {

        expect(Hoek.contain('abc', 'ab')).toBe(true);
        expect(Hoek.contain('abc', 'abc', { only: true })).toBe(true);
        expect(Hoek.contain('aaa', 'a', { only: true })).toBe(true);
        expect(Hoek.contain('aaa', 'a', { only: true, once: true })).toBe(false);
        expect(Hoek.contain('abc', 'b', { once: true })).toBe(true);
        expect(Hoek.contain('abc', ['a', 'c'])).toBe(true);
        expect(Hoek.contain('abc', ['a', 'd'], { part: true })).toBe(true);
        expect(Hoek.contain('aaa', ['a', 'a'], { only: true, once: true })).toBe(false);
        expect(Hoek.contain('aaa', ['a', 'a'], { only: true })).toBe(true);
        expect(Hoek.contain('aaa', ['a', 'a', 'a'], { only: true, once: true })).toBe(true);

        expect(Hoek.contain('abc', 'ac')).toBe(false);
        expect(Hoek.contain('abcd', 'abc', { only: true })).toBe(false);
        expect(Hoek.contain('aab', 'a', { only: true })).toBe(false);
        expect(Hoek.contain('abb', 'b', { once: true })).toBe(false);
        expect(Hoek.contain('abc', ['a', 'd'])).toBe(false);
        expect(Hoek.contain('abc', ['ab', 'bc'])).toBe(false);                      // Overlapping values not supported

        expect(Hoek.contain('', 'a')).toBe(false);
        expect(Hoek.contain('', 'a', { only: true })).toBe(false);

        expect(Hoek.contain('', '')).toBe(true);
        expect(Hoek.contain('', '', { only: true })).toBe(true);
        expect(Hoek.contain('', '', { once: true })).toBe(true);
        expect(Hoek.contain('', ['', ''])).toBe(true);
        expect(Hoek.contain('', ['', ''], { only: true })).toBe(true);
        expect(Hoek.contain('', ['', ''], { once: true })).toBe(false);

        expect(Hoek.contain('a', '')).toBe(true);
        expect(Hoek.contain('a', '', { only: true })).toBe(false);
        expect(Hoek.contain('a', '', { once: true })).toBe(false);
        expect(Hoek.contain('a', ['', ''])).toBe(true);
        expect(Hoek.contain('a', ['', ''], { only: true })).toBe(false);
        expect(Hoek.contain('a', ['', ''], { once: true })).toBe(false);

        expect(Hoek.contain('ab', ['a', 'b', 'c'])).toBe(false);
        expect(Hoek.contain('ab', ['a', 'b', 'c'], { only: true })).toBe(false);
        expect(Hoek.contain('ab', ['a', 'b', 'c'], { only: true, once: true })).toBe(false);

        expect(Hoek.contain('ab', ['c'], { part: true })).toBe(false);
        expect(Hoek.contain('ab', ['b'], { part: true })).toBe(true);
    });

    it('tests arrays', () => {

        expect(Hoek.contain([1, 2, 3], 1)).toBe(true);
        expect(Hoek.contain([{ a: 1 }], { a: 1 }, { deep: true })).toBe(true);
        expect(Hoek.contain([1, 2, 3], [1, 2])).toBe(true);
        expect(Hoek.contain([{ a: 1 }], [{ a: 1 }], { deep: true })).toBe(true);
        expect(Hoek.contain([1, 1, 2], [1, 2], { only: true })).toBe(true);
        expect(Hoek.contain([1, 2], [1, 2], { once: true })).toBe(true);
        expect(Hoek.contain([1, 2, 3], [1, 4], { part: true })).toBe(true);
        expect(Hoek.contain([null, 2, 3], [null, 4], { part: true })).toBe(true);
        expect(Hoek.contain([null], null, { deep: true })).toBe(true);
        expect(Hoek.contain([[1], [2]], [[1]], { deep: true })).toBe(true);
        expect(Hoek.contain([[1], [2], 3], [[1]], { deep: true })).toBe(true);
        expect(Hoek.contain([[1, 2]], [[1]], { deep: true, part: true })).toBe(true);
        expect(Hoek.contain<(number[] | number)[]>([[1, 2]], [[1], 2], { deep: true, part: true })).toBe(true);
        expect(Hoek.contain([1, 2, 1], [1, 1, 2], { only: true })).toBe(true);
        expect(Hoek.contain([1, 2, 1], [1, 1, 2], { only: true, once: true })).toBe(true);
        expect(Hoek.contain([1, 2, 1], [1, 2, 2], { only: true })).toBe(false);
        expect(Hoek.contain([1, 2, 1], [1, 2, 2], { only: true, part: true })).toBe(true);
        expect(Hoek.contain([1, 1, 1], [1, 1, 1, 1])).toBe(false);
        expect(Hoek.contain([1, 1, 1], [1, 1, 1, 1], { part: true })).toBe(true);

        expect(Hoek.contain([1, 2, 3], 4)).toBe(false);
        expect(Hoek.contain([{ a: 1 }], { a: 2 }, { deep: true })).toBe(false);
        expect(Hoek.contain([{ a: 1 }, { a: 1 }], [{ a: 1 }, { a: 1 }], { deep: true, once: true, only: true })).toBe(true);
        expect(Hoek.contain([{ a: 1 }, { a: 1 }], [{ a: 1 }, { a: 2 }], { deep: true, once: true, only: true })).toBe(false);
        expect(Hoek.contain([{ a: 1 }], { a: 1 })).toBe(false);
        expect(Hoek.contain([1, 2, 3], [4, 5])).toBe(false);
        expect(Hoek.contain([[3], [2]], [[1]])).toBe(false);
        expect(Hoek.contain([[1], [2]], [[1]])).toBe(false);
        expect(Hoek.contain([[1, 2]], [[1]], { deep: true })).toBe(false);
        expect(Hoek.contain([{ a: 1 }], [{ a: 2 }], { deep: true })).toBe(false);
        expect(Hoek.contain([1, 3, 2], [1, 2], { only: true })).toBe(false);
        expect(Hoek.contain([1, 2, 2], [1, 2], { once: true })).toBe(false);
        expect(Hoek.contain([0, 2, 3], [1, 4], { part: true })).toBe(false);
        expect(Hoek.contain([1, 2, 1], [1, 2, 2], { only: true, once: true })).toBe(false);
        expect(Hoek.contain([1, 2, 1], [1, 2], { only: true, once: true })).toBe(false);

        expect(Hoek.contain([], 1)).toBe(false);
        expect(Hoek.contain([], 1, { only: true })).toBe(false);

        expect(Hoek.contain(['a', 'b'], ['a', 'b', 'c'])).toBe(false);
        expect(Hoek.contain(['a', 'b'], ['a', 'b', 'c'], { only: true })).toBe(false);
        expect(Hoek.contain(['a', 'b'], ['a', 'b', 'c'], { only: true, once: true })).toBe(false);

        expect(Hoek.contain(['a', 'b'], ['c'], { part: true })).toBe(false);
        expect(Hoek.contain(['a', 'b'], ['b'], { part: true })).toBe(true);

        expect(Hoek.contain([{ a: 1 }], [1], { deep: true })).toBe(false);
    });

    it('tests objects', () => {

        type TTnum = Record<string, number>;
        type TTstr = Record<string, string>;
        type TTo = Record<string, TTnum>;
        type TTn = Record<string, TTo>;
        type TTa = Record<string, TTnum[]>;

        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, 'a')).toBe(true);
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toBe(true);
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, ['a', 'b', 'c'], { only: true })).toBe(true);
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, { a: 1 })).toBe(true);
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, { a: 1, c: 3 })).toBe(true);
        expect(Hoek.contain<TTnum>({ a: 1, b: 2, c: 3 }, { a: 1, d: 4 }, { part: true })).toBe(true);
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 }, { only: true })).toBe(true);
        expect(Hoek.contain({ a: [1], b: [2], c: [3] }, { a: [1], c: [3] }, { deep: true })).toBe(true);
        expect(Hoek.contain<TTa>({ a: [{ b: 1 }, { c: 2 }, { d: 3, e: 4 }] }, { a: [{ b: 1 }, { d: 3 }] }, { deep: true })).toBe(false);
        expect(Hoek.contain<TTa>({ a: [{ b: 1 }, { c: 2 }, { d: 3, e: 4 }] }, { a: [{ b: 1 }, { d: 3 }] }, { deep: true, part: true })).toBe(true);
        expect(Hoek.contain<TTa>({ a: [{ b: 1 }, { c: 2 }, { d: 3, e: 4 }] }, { a: [{ b: 1 }, { d: 3 }] }, { deep: true, part: false })).toBe(false);
        expect(Hoek.contain<TTa>({ a: [{ b: 1 }, { c: 2 }, { d: 3, e: 4 }] }, { a: [{ b: 1 }, { d: 3 }] }, { deep: true, only: true })).toBe(false);
        expect(Hoek.contain<TTa>({ a: [{ b: 1 }, { c: 2 }, { d: 3, e: 4 }] }, { a: [{ b: 1 }, { d: 3 }] }, { deep: true, only: false })).toBe(true);
        expect(Hoek.contain({ a: [1, 2, 3] }, { a: [2, 4, 6] }, { deep: true, part: true })).toBe(true);

        expect(Hoek.contain<TTnum>({ a: 1, b: 2, c: 3 }, 'd')).toBe(false);
        expect(Hoek.contain<TTnum>({ a: 1, b: 2, c: 3 }, ['a', 'd'])).toBe(false);
        expect(Hoek.contain({ a: 1, b: 2, c: 3, d: 4 }, ['a', 'b', 'c'], { only: true })).toBe(false);
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, { a: 2 })).toBe(false);
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, { a: 2, b: 2 }, { part: true })).toBe(false);             // part does not ignore bad value
        expect(Hoek.contain<TTnum>({ a: 1, b: 2, c: 3 }, { a: 1, d: 3 })).toBe(false);
        expect(Hoek.contain<TTnum>({ a: 1, b: 2, c: 3 }, { a: 1, d: 4 })).toBe(false);
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, { a: 1, b: 2 }, { only: true })).toBe(false);
        expect(Hoek.contain({ a: [1], b: [2], c: [3] }, { a: [1], c: [3] })).toBe(false);
        expect(Hoek.contain<TTn>({ a: { b: { c: 1, d: 2 } } }, { a: { b: { c: 1 } } })).toBe(false);
        expect(Hoek.contain<TTn>({ a: { b: { c: 1, d: 2 } } }, { a: { b: { c: 1 } } }, { deep: true })).toBe(false);
        expect(Hoek.contain<TTn>({ a: { b: { c: 1, d: 2 } } }, { a: { b: { c: 1 } } }, { deep: true, only: true })).toBe(false);
        expect(Hoek.contain<TTn>({ a: { b: { c: 1, d: 2 } } }, { a: { b: { c: 1 } } }, { deep: true, only: false })).toBe(true);
        expect(Hoek.contain<TTn>({ a: { b: { c: 1, d: 2 } } }, { a: { b: { c: 1 } } }, { deep: true, part: true })).toBe(true);
        expect(Hoek.contain<TTn>({ a: { b: { c: 1, d: 2 } } }, { a: { b: { c: 1 } } }, { deep: true, part: false })).toBe(false);
        expect(Hoek.contain({ a: [1, 2, 3] }, { a: [4, 5, 6] }, { deep: true, part: true })).toBe(false);

        expect(Hoek.contain({}, 'a')).toBe(false);
        expect(Hoek.contain({}, 'a', { only: true })).toBe(false);

        expect(Hoek.contain<TTstr>({ a: 'foo', b: 'bar' }, ['a', 'b', 'c'])).toBe(false);
        expect(Hoek.contain<TTstr>({ a: 'foo', b: 'bar' }, ['a', 'b', 'c'], { only: true })).toBe(false);
        expect(Hoek.contain<TTstr>({ a: 'foo', b: 'bar' }, { a: 'foo', b: 'bar', c: 'x' })).toBe(false);
        expect(Hoek.contain<TTstr>({ a: 'foo', b: 'bar' }, { a: 'foo', b: 'bar', c: 'x' }, { only: true })).toBe(false);

        expect(Hoek.contain<TTnum>({ a: 1, b: 2 }, ['c'], { part: true })).toBe(false);
        expect(Hoek.contain<TTnum>({ a: 1, b: 2 }, ['b'], { part: true })).toBe(true);

        // Getter check

        {

            type FooType = {

                bar?: string;
                baz?: string;
            }

            interface FooItf extends FooType {

                new (bar: string): FooType;
            }

            type FooRecord = Record<string, FooType>;


            const Foo = function (this: FooItf, bar: string) {

                this.bar = bar;
            } as unknown as FooItf;

            const getBar = function (this: FooItf) {

                return this.bar;
            };

            const createFoo = (value: string) => {

                const foo = new Foo(value);

                Object.defineProperty(foo, 'baz', {
                    enumerable: true,
                    get: getBar
                });

                return foo;
            };

            expect(Hoek.contain({ a: createFoo('b') }, { a: createFoo('b') }, { deep: true })).toBe(true);
            expect(Hoek.contain({ a: createFoo('b') }, { a: createFoo('b') }, { deep: true, part: true })).toBe(true);
            expect(Hoek.contain<FooRecord>({ a: createFoo('b') }, { a: { bar: 'b', baz: 'b' } }, { deep: true })).toBe(true);
            expect(Hoek.contain<FooRecord>({ a: createFoo('b') }, { a: { bar: 'b', baz: 'b' } }, { deep: true, only: true })).toBe(false);
            expect(Hoek.contain<FooRecord>({ a: createFoo('b') }, { a: { baz: 'b' } }, { deep: true, part: false })).toBe(false);
            expect(Hoek.contain<FooRecord>({ a: createFoo('b') }, { a: { baz: 'b' } }, { deep: true, part: true })).toBe(true);
            expect(Hoek.contain({ a: createFoo('b') }, { a: createFoo('b') }, { deep: true })).toBe(true);

        }

        // Properties on prototype not visible

        {

            type FooType = {

                a: number;
                b: number;
                c: number;
            }

            interface FooItf extends FooType {

                new (): FooType;
            }

            const Foo = function (this: FooItf) {

                this.a = 1;
            } as unknown as FooItf;

            Object.defineProperty(Foo.prototype, 'b', {
                enumerable: true,
                value: 2
            });

            const Bar = function (this: FooItf) {

                Foo.call(this);
                this.c = 3;
            } as unknown as FooItf;

            Util.inherits(Bar, Foo);

            expect((new Bar()).a).toHoequal(1);
            expect((new Bar()).b).toHoequal(2);
            expect((new Bar()).c).toHoequal(3);
            expect(Hoek.contain(new Bar(), { 'a': 1, 'c': 3 }, { only: true })).toBe(true);
            expect(Hoek.contain(new Bar(), 'b')).toBe(false);
        }

        // Non-Enumerable properties

        {
            const foo = { a: 1, b: 2 } as {
                a: number;
                b: number;
                c?: number;
            };

            Object.defineProperty(foo, 'c', {
                enumerable: false,
                value: 3
            });

            expect(Hoek.contain(foo, 'c')).toBe(true);
            expect(Hoek.contain(foo, { 'c': 3 })).toBe(true);
            expect(Hoek.contain(foo, { 'a': 1, 'b': 2, 'c': 3 }, { only: true })).toBe(true);
        }
    });

    it('supports symbols', () => {

        const sym = Symbol();

        expect(Hoek.contain([sym], sym)).toBe(true);
        expect(Hoek.contain({ [sym]: 1 }, sym)).toBe(true);
        expect(Hoek.contain({ [sym]: 1, a: 2 }, { [sym]: 1 })).toBe(true);

        expect(Hoek.contain([sym], Symbol())).toBe(false);
        expect(Hoek.contain<any>({ [sym]: 1 }, Symbol())).toBe(false);
    });

    it('compares error keys', () => {

        const error = new Error('test') as (
            Error & {
                x?: number;
                y?: number;
            }
        );

        expect(Hoek.contain(error, { x: 1 })).toBe(false);
        expect(Hoek.contain(error, { x: 1 }, { part: true })).toBe(false);

        error.x = 1;

        expect(Hoek.contain(error, { x: 1 })).toBe(true);
        expect(Hoek.contain(error, { x: 1 }, { part: true })).toBe(true);

        expect(Hoek.contain(error, { x: 1, y: 2 })).toBe(false);
        expect(Hoek.contain(error, { x: 1, y: 2 }, { part: true })).toBe(true);
    });
});

describe('flatten()', () => {

    it('returns a flat array', () => {

        const result = Hoek.flatten([1, 2, [3, 4, [5, 6], [7], 8], [9], [10, [11, 12]], 13]);
        expect(result.length).toHoequal(13);
        expect(result).toHoequal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    });
});

describe('reach()', () => {

    const sym = Symbol();
    const obj = {
        a: {
            b: {
                c: {
                    d: 1,
                    e: 2
                },
                f: 'hello'
            },
            g: {
                h: 3
            },
            '-2': true,
            [sym]: {
                v: true
            }
        },
        i: (function () { }) as ((() => any) & { x: number }),
        j: null,
        k: [4, 8, 9, 1]
    };

    obj.i.x = 5;

    it('returns object itself', () => {

        expect(Hoek.reach(obj, null)).toHoequal(obj);
        expect(Hoek.reach(obj, false)).toHoequal(obj);
        expect(Hoek.reach(obj)).toHoequal(obj);
        expect(Hoek.reach(obj, [])).toHoequal(obj);
    });

    it('returns values of array', () => {

        expect(Hoek.reach(obj, 'k.0')).toHoequal(4);
        expect(Hoek.reach(obj, 'k.1')).toHoequal(8);
    });

    it('returns last value of array using negative index', () => {

        expect(Hoek.reach(obj, 'k.-1')).toHoequal(1);
        expect(Hoek.reach(obj, 'k.-2')).toHoequal(9);
    });

    it('returns object property with negative index for non-array', () => {

        expect(Hoek.reach(obj, 'a.-2')).toHoequal(true);
    });

    it('returns a valid member', () => {

        expect(Hoek.reach(obj, 'a.b.c.d')).toHoequal(1);
    });

    it('returns a valid member with separator override', () => {

        expect(Hoek.reach(obj, 'a/b/c/d', '/')).toHoequal(1);
    });

    it('returns undefined on null object', () => {

        expect(Hoek.reach(null, 'a.b.c.d')).toHoequal(undefined);
    });

    it('returns undefined on missing object member', () => {

        expect(Hoek.reach(obj, 'a.b.c.d.x')).toHoequal(undefined);
    });

    it('returns undefined on missing function member', () => {

        expect(Hoek.reach(obj, 'i.y', { functions: true })).toHoequal(undefined);
    });

    it('throws on missing member in strict mode', () => {

        expect(() => {

            Hoek.reach(obj, 'a.b.c.o.x', { strict: true });
        }).toThrow('Missing segment o in reach path  a.b.c.o.x');

    });

    it('returns undefined on invalid member', () => {

        expect(Hoek.reach(obj, 'a.b.c.d-.x')).toHoequal(undefined);
        expect(Hoek.reach(obj, 'k.x')).toHoequal(undefined);
        expect(Hoek.reach(obj, 'k.1000')).toHoequal(undefined);
        expect(Hoek.reach(obj, 'k/0.5', '/')).toHoequal(undefined);
    });

    it('returns function member', () => {

        expect(typeof Hoek.reach(obj, 'i')).toHoequal('function');
    });

    it('returns function property', () => {

        expect(Hoek.reach(obj, 'i.x')).toHoequal(5);
    });

    it('returns null', () => {

        expect(Hoek.reach(obj, 'j')).toHoequal(null);
    });

    it('throws on function property when functions not allowed', () => {

        expect(() => {

            Hoek.reach(obj, 'i.x', { functions: false });
        }).toThrow('Invalid segment x in reach path  i.x');
    });

    it('will return a default value if property is not found', () => {

        expect(Hoek.reach(obj, 'a.b.q', { default: 'defaultValue' })).toHoequal('defaultValue');
    });

    it('will return a default value if path is not found', () => {

        expect(Hoek.reach(obj, 'q', { default: 'defaultValue' })).toHoequal('defaultValue');
    });

    it('allows a falsey value to be used as the default value', () => {

        expect(Hoek.reach(obj, 'q', { default: '' })).toHoequal('');
    });

    it('allows array-based lookup', () => {

        expect(Hoek.reach(obj, ['a', 'b', 'c', 'd'])).toHoequal(1);
        expect(Hoek.reach(obj, ['k', '1'])).toHoequal(8);
        expect(Hoek.reach(obj, ['k', 1])).toHoequal(8);
        expect(Hoek.reach(obj, ['k', '-2'])).toHoequal(9);
        expect(Hoek.reach(obj, ['k', -2])).toHoequal(9);
    });

    it('allows array-based lookup with symbols', () => {

        expect(Hoek.reach(obj, ['a', sym, 'v'])).toHoequal(true);
        expect(Hoek.reach(obj, ['a', Symbol(), 'v'])).toHoequal(undefined);
    });

    it('returns character in string', () => {

        expect(Hoek.reach(['abc'], [0])).toHoequal('abc');
        expect(Hoek.reach(['abc'], ['0'])).toHoequal('abc');
    });

    it('reaches sets and maps', () => {

        const value = {
            a: {
                b: new Set([
                    { x: 1 },
                    { x: 2 },
                    {
                        y: new Map([
                            ['v', 4],
                            ['w', 5]
                        ])
                    }
                ])
            }
        };

        expect(Hoek.reach(value, 'a.b.2.y.w')).toBeUndefined();
        expect(Hoek.reach(value, 'a.b.2.y.w', { iterables: true })).toHoequal(5);
    });
});

describe('reachTemplate()', () => {

    it('applies object to template', () => {

        const obj = {
            a: {
                b: {
                    c: {
                        d: 1
                    }
                }
            },
            j: null,
            k: [4, 8, 9, 1]
        };

        const template = '{k.0}:{k.-2}:{a.b.c.d}:{x.y}:{j}';

        expect(Hoek.reachTemplate(obj, template)).toHoequal('4:9:1::');
    });

    it('applies object to template (options)', () => {

        const obj = {
            a: {
                b: {
                    c: {
                        d: 1
                    }
                }
            },
            j: null,
            k: [4, 8, 9, 1]
        };

        const template = '{k/0}:{k/-2}:{a/b/c/d}:{x/y}:{j}';

        expect(Hoek.reachTemplate(obj, template, '/')).toHoequal('4:9:1::');
    });

    it('isn\'t prone to ReDoS given an adversarial template', () => {

        const sizes = [0, 1, 2, 3, 4]; // Should be evenly-spaced
        const times = [];
        const diffs = [];

        for (const size of sizes) {
            const start = Date.now();
            Hoek.reachTemplate({}, '{'.repeat(size * 10000));
            times.push(Date.now() - start);
        }

        for (let i = 1; i < times.length; ++i) {
            diffs.push(times[i]! - times[i - 1]!);
        }

        // Under ReDoS, as the size of the input increases the timing accelerates upwards,
        // i.e. each timing diff would be greater than the last.

        const diffsMonotonic = diffs[0]! < diffs[1]! && diffs[1]! < diffs[2]! && diffs[2]! < diffs[3]!;

        expect(diffsMonotonic, 'Timing diffs monotonic').toBe(false);
    });
});

describe('assert()', () => {

    it('throws an Error when using assert in a test', () => {

        expect(() => {

            Hoek.assert(false, 'my error message');
        }).toThrow(new Hoek.AssertError('my error message'));
    });

    it('throws an Error when using assert in a test with no message', () => {

        expect(() => {

            Hoek.assert(false);
        }).toThrow(new Hoek.AssertError('Unknown error'));
    });

    it('throws an Error when using assert in a test with multipart message', () => {

        expect(() => {

            Hoek.assert(false, 'This', 'is', 'my message');
        }).toThrow(new Hoek.AssertError('This is my message'));
    });

    it('throws an Error when using assert in a test with multipart message (empty)', () => {

        expect(() => {

            Hoek.assert(false, 'This', 'is', '', 'my message');
        }).toThrow(new Hoek.AssertError('This is my message'));
    });

    it('throws an Error when using assert in a test with object message', () => {

        expect(() => {

            Hoek.assert(false, 'This', 'is', { spinal: 'tap' } as never);
        }).toThrow(new Hoek.AssertError('This is {"spinal":"tap"}'));
    });

    it('throws an Error when using assert in a test with multipart string and error messages', () => {

        expect(() => {

            Hoek.assert(false, new Error('This'), 'is', 'spinal', new Error('tap'));
        }).toThrow(new Hoek.AssertError('This is spinal tap'));
    });

    it('throws an Error when using assert in a test with error object message', () => {

        const err = new TypeError('This is spinal tap');
        let got;
        expect(() => {

            try {
                Hoek.assert(false, err);
            }
            catch (e) {
                got = e;
                throw e;
            }
        }).toThrow(new TypeError('This is spinal tap'));
        expect(got).toBe(err);
    });

    it('throws the same Error that is passed to it if there is only one error passed', () => {

        const error = new Error('ruh roh');
        const error2 = new Error('ruh roh');

        const fn = function () {

            Hoek.assert(false, error);
        };

        try {
            fn();
        }
        catch (err) {
            expect(err).toHoequal(error);  // should be the same reference
            expect(err).not.toBe(error2); // error with the same message should not match
        }
    });
});

describe('AssertError', () => {

    it('takes an optional message', () => {

        expect(new Hoek.AssertError().message).toHoequal('Unknown error');
        expect(new Hoek.AssertError(null).message).toHoequal('Unknown error');
        expect(new Hoek.AssertError('msg').message).toHoequal('msg');
    });

    it('has AssertError name property', () => {

        expect(new Hoek.AssertError().name).toHoequal('AssertError');
        expect(new Hoek.AssertError('msg').name).toHoequal('AssertError');
    });

    it('uses ctor argument to hide stack', { skip: typeof Error.captureStackTrace !== 'function' }, () => {

        const parentFn = () => {

            throw new Hoek.AssertError('msg', parentFn);
        };

        let err;
        expect(() => {

            try {
                parentFn();
            }
            catch (e) {
                err = e;
                throw e;
            }
        }).toThrow(Hoek.AssertError);

        expect(err!.stack).not.toContain('parentFn');
    });
});

describe('Bench', () => {

    it('returns time elapsed', async () => {

        const timer = new Hoek.Bench();
        await Hoek.wait(12);
        expect(timer.elapsed()).toBeGreaterThan(9);
    });
});

describe('escapeRegex()', () => {

    it('escapes all special regular expression characters', () => {

        const a = Hoek.escapeRegex('4^f$s.4*5+-_?%=#!:@|~\\/`"(>)[<]d{}s,');
        expect(a).toHoequal('4\\^f\\$s\\.4\\*5\\+\\-_\\?%\\=#\\!\\:@\\|~\\\\\\/`"\\(>\\)\\[<\\]d\\{\\}s\\,');
    });
});

describe('escapeHeaderAttribute()', () => {

    it('should not alter ascii values', () => {

        const a = Hoek.escapeHeaderAttribute('My Value');
        expect(a).toHoequal('My Value');
    });

    it('escapes all special HTTP header attribute characters', () => {

        const a = Hoek.escapeHeaderAttribute('I said go!!!#"' + String.fromCharCode(92));
        expect(a).toHoequal('I said go!!!#\\"\\\\');
    });

    it('throws on large unicode characters', () => {

        expect(() => {

            Hoek.escapeHeaderAttribute('this is a test' + String.fromCharCode(500) + String.fromCharCode(300));
        }).toThrow(Error);
    });

    it('throws on CRLF to prevent response splitting', () => {

        expect(() => {

            Hoek.escapeHeaderAttribute('this is a test\r\n');
        }).toThrow(Error);
    });
});

describe('escapeHtml()', () => {

    it('escapes all special HTML characters', () => {

        const a = Hoek.escapeHtml('&<>"\'`');
        expect(a).toHoequal('&amp;&lt;&gt;&quot;&#x27;&#x60;');
    });

    it('returns empty string on falsy input', () => {

        const a = Hoek.escapeHtml('');
        expect(a).toHoequal('');
    });

    it('returns unchanged string on no reserved input', () => {

        const a = Hoek.escapeHtml('abc');
        expect(a).toHoequal('abc');
    });
});

describe('once()', () => {

    it('allows function to only execute once', () => {

        let gen = 0;
        let add = function (x: number) {

            gen += x;
        };

        add(5);
        expect(gen).toHoequal(5);
        add = Hoek.once(add);
        add(5);
        expect(gen).toHoequal(10);
        add(5);
        expect(gen).toHoequal(10);
    });

    it('double once wraps one time', () => {

        let method = function () { } as ((() => void) & { x?: number });
        method = Hoek.once(method);
        method.x = 1;
        method = Hoek.once(method);
        expect(method.x).toHoequal(1);
    });
});

describe('ignore()', () => {

    it('exists', () => {

        expect(Hoek.ignore).toBeDefined();
        expect(typeof Hoek.ignore).toHoequal('function');
    });
});

describe('stringify()', () => {

    it('converts object to string', () => {

        const obj = { a: 1 };
        expect(Hoek.stringify(obj)).toHoequal('{"a":1}');
    });

    it('returns error in result string', () => {

        const obj = { a: 1 } as any;
        obj.b = obj;
        expect(Hoek.stringify(obj)).toContain('Cannot display object');
    });
});

describe('isPromise()', () => {

    it('determines if an object is a promise', async () => {

        expect(Hoek.isPromise({})).toBe(false);
        expect(Hoek.isPromise(null)).toBe(false);
        expect(Hoek.isPromise(false)).toBe(false);
        expect(Hoek.isPromise(0)).toBe(false);
        expect(Hoek.isPromise('')).toBe(false);
        expect(Hoek.isPromise({ then: 1 })).toBe(false);
        expect(Hoek.isPromise([])).toBe(false);

        const items = [
            Promise.resolve(),
            Promise.reject()
        ];

        expect(Hoek.isPromise(items[0])).toBe(true);
        expect(Hoek.isPromise(items[1])).toBe(true);
        expect(Hoek.isPromise(new Promise(Hoek.ignore))).toBe(true);
        expect(Hoek.isPromise({ then: Hoek.ignore })).toBe(true);

        try {
            await Promise.all(items);
        }
        catch { }
    });
});

describe('wait()', () => {

    it('delays for timeout ms', async () => {

        const timeout = {} as { before?: boolean; after?: boolean };
        setTimeout(() => (timeout.before = true), 10);
        const wait = Hoek.wait(10);
        setTimeout(() => (timeout.after = true), 10);

        await wait;

        expect(timeout.before).toBe(true);
        expect(timeout.after).toBeUndefined();
    });

    it('delays for timeout ms as bigint', async () => {

        const timeout = {} as { before?: boolean; after?: boolean };
        setTimeout(() => (timeout.before = true), 10);
        const wait = Hoek.wait(10n);
        setTimeout(() => (timeout.after = true), 10);

        await wait;

        expect(timeout.before).toBe(true);
        expect(timeout.after).toBeUndefined();
    });

    it('handles timeouts >= 2^31', async () => {

        const flow = [];
        let no = 0;

        const fakeTimeout = function (cb: Function, time: number) {

            const timer = ++no;

            flow.push(`CALL(${timer}): ${time}`);
            setImmediate(() => {

                flow.push(`PRE(${timer})`);
                cb();
                flow.push(`POST(${timer})`);
            });
        };

        await Hoek.wait(2 ** 31, null, { setTimeout: fakeTimeout });
        flow.push('DONE1');
        await Hoek.wait(2 ** 32 + 2 ** 30, null, { setTimeout: fakeTimeout });
        flow.push('DONE2');

        expect(flow).toHoequal([
            'CALL(1): 2147483647',
            'PRE(1)',
            'CALL(2): 1',
            'POST(1)',
            'PRE(2)',
            'POST(2)',
            'DONE1',
            'CALL(3): 2147483647',
            'PRE(3)',
            'CALL(4): 2147483647',
            'POST(3)',
            'PRE(4)',
            'CALL(5): 1073741826',
            'POST(4)',
            'PRE(5)',
            'POST(5)',
            'DONE2'
        ]);
    });

    it('returns never resolving promise when timeout >= Number.MAX_SAFE_INTEGER', async () => {

        let calls = 0;
        const fakeTimeout = function (cb: Function) {

            ++calls;
            process.nextTick(cb);
        };

        await Hoek.wait(2 ** 31 - 1, null, { setTimeout: fakeTimeout });
        expect(calls).toHoequal(1);

        const waited = Symbol('waited');

        const result = await Promise.race([
            Hoek.wait(1, waited),
            Hoek.wait(Number.MAX_SAFE_INTEGER, null, { setTimeout: fakeTimeout }),
            Hoek.wait(Infinity, null, { setTimeout: fakeTimeout })
        ]);

        expect(result).toHoequal(waited);
        expect(calls).toHoequal(1);
    });

    it('handles a return value', async () => {

        const uniqueValue = {};
        const timeout = {} as { before?: boolean; after?: boolean };
        setTimeout(() => (timeout.before = true), 10);
        const wait = Hoek.wait(10, uniqueValue);
        setTimeout(() => (timeout.after = true), 10);

        expect(await wait).toBe(uniqueValue);
        expect(timeout.before).toBe(true);
        expect(timeout.after).toBeUndefined();
    });

    it('undefined timeout resolves immediately', async () => {

        const waited = Symbol('waited');
        const result = await Promise.race([
            Hoek.wait(undefined, waited),
            Hoek.wait(0)
        ]);

        expect(result).toHoequal(waited);
    });

    it('NaN timeout resolves immediately', async () => {

        const waited = Symbol('waited');
        const result = await Promise.race([
            Hoek.wait(Number.NaN, waited),
            Hoek.wait(0)
        ]);

        expect(result).toHoequal(waited);
    });

    it('rejects on weird timeout values', async () => {

        await expect(() => Hoek.wait({} as never)).toThrow();
        await expect(() => Hoek.wait(Symbol('hi') as never)).toThrow();
    });
});

describe('block()', () => {

    it('returns a promise', () => {

        expect(Hoek.block()).toBeInstanceOf(Promise);
    });

    it('does not immediately reject or resolve', async () => {

        const promise = Hoek.block();
        const waited = Symbol('waited');

        const result = await Promise.race([
            Hoek.wait(1, waited),
            promise
        ]);

        expect(result).toHoequal(waited);
    });
});
