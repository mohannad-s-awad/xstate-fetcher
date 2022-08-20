var Ae = Object.defineProperty;
var Se = (a, i, e) => i in a ? Ae(a, i, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[i] = e;
var B = (a, i, e) => (Se(a, typeof i != "symbol" ? i + "" : i, e), e);
import { createMachine as H, actions as _, interpret as L } from "xstate";
const Me = () => new Fe();
class Fe {
  constructor() {
    B(this, "_entries", []);
    B(this, "_subscriptions", []);
  }
  has(i) {
    return this._findIndex(i) !== -1;
  }
  set(i, e, r = {}) {
    const d = this._findIndex(i);
    d !== -1 && this._remove(d);
    const { cacheTime: n, keepActive: u } = r, l = {
      key: i,
      fetcher: e,
      cacheTime: n != null ? n : Number.POSITIVE_INFINITY,
      activatorsCount: 0,
      keepActive: u != null ? u : !1,
      subscribeFns: [],
      unsubscribeFn: () => {
      }
    };
    l.subscribeFns = this._filterSubscribeFns(this._subscriptions, l), l.unsubscribeFn = e.subscribe(
      (f) => this._notifySubscribeFns(f, l)
    ).unsubscribe, this._entries.push(l);
  }
  get(i) {
    const e = this._findIndex(i);
    if (e === -1)
      throw new Error("Cannot find an entry with this key!");
    return this._entries[e];
  }
  remove(i) {
    const e = this._findIndex(i);
    if (e === -1)
      throw new Error("Cannot find an entry with this key!");
    this._remove(e);
  }
  setCacheTime(i, e) {
    const r = this._findIndex(i);
    if (r === -1)
      throw new Error("Cannot find an entry with this key!");
    this._setCacheTime(r, e);
  }
  getCacheTime(i) {
    const e = this._findIndex(i);
    if (e === -1)
      throw new Error("Cannot find an entry with this key!");
    return this._entries[e].cacheTime;
  }
  setKeepActive(i, e) {
    const r = this._findIndex(i);
    if (r === -1)
      throw new Error("Cannot find an entry with this key!");
    const d = this._entries[r];
    e && !d.keepActive && d.activatorsCount === 0 && d.fetcher.send({ type: "ENABLE" }), d.keepActive = e;
  }
  getKeepActive(i) {
    const e = this._findIndex(i);
    if (e === -1)
      throw new Error("Cannot find an entry with this key!");
    return this._entries[e].keepActive;
  }
  activate(i) {
    const e = this._findIndex(i);
    if (e === -1)
      throw new Error("Cannot find an entry with this key!");
    const r = this._entries[e];
    ++r.activatorsCount === 1 && r.cacheTimeout !== void 0 && clearTimeout(r.cacheTimeout);
  }
  deactivate(i) {
    const e = this._findIndex(i);
    if (e === -1)
      throw new Error("Cannot find an entry with this key!");
    const r = this._entries[e];
    --r.activatorsCount === 0 && (r.cacheTime !== Number.POSITIVE_INFINITY && (r.cacheTimeout = setTimeout(() => {
      r.cacheTimeout = void 0, this._remove(e);
    }, r.cacheTime)), r.keepActive || r.fetcher.send({ type: "DISABLE" }));
  }
  filter(i, e) {
    return this._entries.filter(
      (r) => this._matchKeys(r.key, i, e == null ? void 0 : e.isExact) && ((e == null ? void 0 : e.predicateFn) === void 0 || e.predicateFn(r))
    );
  }
  batch(i, e, r) {
    this.filter(i, r).forEach(e);
  }
  subscribe(i) {
    return this._subscriptions.push(...i), this._entries.forEach((e) => {
      e.subscribeFns.push(
        ...this._filterSubscribeFns(i, e)
      );
    }), () => i.forEach((e) => {
      const r = this._subscriptions.indexOf(e);
      this._subscriptions.splice(r, 1), this._entries.forEach((d) => {
        const n = d.subscribeFns.indexOf(
          e.subscribeFn
        );
        d.subscribeFns.splice(n, 1);
      });
    });
  }
  _findIndex(i) {
    return this._entries.findIndex(
      (e) => this._matchKeys(e.key, i, !0)
    );
  }
  _matchKeys(i, e, r = !1) {
    if (i === e)
      return !0;
    if (typeof i == "object" && i !== null && typeof e == "object" && e !== null) {
      const d = Object.keys(i), n = Object.keys(e);
      if (!r || d.length === n.length)
        return (r ? d : n).every(
          (u) => this._matchKeys(
            Array.isArray(i) ? i[Number(u)] : i[u],
            Array.isArray(e) ? e[Number(u)] : e[u],
            r
          )
        );
    }
    return !1;
  }
  _setCacheTime(i, e) {
    if (e < 0)
      throw new Error("Cannot set the cache time to a negative number!");
    const r = this._entries[i];
    r.cacheTimeout !== void 0 && (clearTimeout(r.cacheTimeout), r.cacheTimeout = e !== Number.POSITIVE_INFINITY ? setTimeout(
      () => {
        r.cacheTimeout = void 0, this._remove(i);
      },
      r.cacheTime !== Number.POSITIVE_INFINITY ? Math.max(e - r.cacheTime, 0) : e
    ) : void 0), r.cacheTime = e;
  }
  _filterSubscribeFns(i, e) {
    return i.filter(
      (r) => {
        var d;
        return ((d = r.keys) != null ? d : [r.key]).some(
          (n) => this._matchKeys(e.key, n, r.isExact) && (r.predicateFn === void 0 || r.predicateFn(e))
        );
      }
    ).map((r) => {
      if (e.subscribeFns.includes(r.subscribeFn))
        throw new Error(
          "Cannot reuse a subscribe function with the same entry!"
        );
      return r.subscribeFn;
    });
  }
  _notifySubscribeFns(i, e) {
    e.subscribeFns.forEach(
      (r) => queueMicrotask(() => r({ state: i, entry: e }))
    );
  }
  _remove(i) {
    const e = this._entries[i];
    if (e.activatorsCount !== 0)
      throw new Error("Cannot remove an active entry!");
    e.cacheTimeout !== void 0 && (clearTimeout(e.cacheTimeout), e.cacheTimeout = void 0), e.unsubscribeFn(), this._entries.splice(i, 1);
  }
}
const P = (a) => a.event.type !== "" ? a.event : a.history !== void 0 ? P(a.history) : void 0, J = (a = {}) => {
  const i = H(
    {
      id: "fetcher",
      strict: !0,
      preserveActionOrder: !0,
      tsTypes: {},
      schema: {
        context: {},
        events: {},
        services: {}
      },
      context: {},
      type: "parallel",
      states: {
        request: {
          initial: "checking",
          states: {
            checking: {
              always: [
                {
                  cond: "isDisabled",
                  target: "disabled"
                },
                {
                  cond: "shouldLoad",
                  target: "loading"
                },
                "idle"
              ]
            },
            idle: {},
            disabled: {},
            loading: {
              entry: ["setCurrentAborter", "setCurrentFetch"],
              invoke: {
                id: "currentFetch",
                src: "currentFetch",
                onDone: {
                  target: ["loaded", "#fetcher.response.checking"],
                  actions: [
                    "setData",
                    "setTimestamp",
                    "validate",
                    "clearCurrentAborter",
                    "clearCurrentFetch"
                  ]
                },
                onError: {
                  target: "failed",
                  actions: ["clearCurrentAborter", "clearCurrentFetch"]
                }
              }
            },
            loaded: {},
            aborted: {
              after: {
                AUTO_RESET_TIME: {
                  cond: "isLimitedAutoResetTime",
                  target: "checking"
                }
              }
            },
            failed: {
              after: {
                AUTO_RESET_TIME: {
                  cond: "isLimitedAutoResetTime",
                  target: "checking"
                }
              }
            }
          },
          on: {
            LOAD: {
              target: "request.checking",
              actions: [
                "abortCurrentFetch",
                "clearCurrentAborter",
                "clearCurrentFetch"
              ]
            },
            ABORT: {
              target: "request.aborted",
              actions: [
                "abortCurrentFetch",
                "clearCurrentAborter",
                "clearCurrentFetch"
              ]
            }
          }
        },
        response: {
          initial: "checking",
          states: {
            checking: {
              always: [
                {
                  cond: "isFresh",
                  target: "fresh"
                },
                {
                  cond: "isStale",
                  target: "stale"
                },
                "none"
              ]
            },
            none: {},
            stale: {},
            fresh: {
              after: {
                REMAINING_FRESH_TIME: {
                  cond: "isLimitedFreshTime",
                  target: ["stale", "#fetcher.request.checking"]
                }
              }
            }
          }
        }
      },
      entry: ["setDefaultOptions", "setData", "setTimestamp"],
      on: {
        SET_OPTIONS: {
          target: [".request.checking", ".response.checking"],
          actions: [
            "setOptions",
            "setDefaultOptions",
            "setData",
            "setTimestamp",
            "invalidate",
            "abortCurrentFetch",
            "clearCurrentAborter",
            "clearCurrentFetch"
          ]
        },
        SET_DATA: {
          target: [".request.checking", ".response.checking"],
          actions: [
            "setData",
            "setTimestamp",
            "validate",
            "abortCurrentFetch",
            "clearCurrentAborter",
            "clearCurrentFetch"
          ]
        },
        SET_TIMESTAMP: {
          target: [".request.checking", ".response.checking"],
          actions: [
            "setTimestamp",
            "abortCurrentFetch",
            "clearCurrentAborter",
            "clearCurrentFetch"
          ]
        },
        INVALIDATE: {
          target: [".request.checking", ".response.checking"],
          actions: [
            "invalidate",
            "abortCurrentFetch",
            "clearCurrentAborter",
            "clearCurrentFetch"
          ]
        },
        ENABLE: {
          target: ".request.checking",
          actions: [
            "enable",
            "abortCurrentFetch",
            "clearCurrentAborter",
            "clearCurrentFetch"
          ]
        },
        DISABLE: {
          target: ".request.checking",
          actions: [
            "disable",
            "abortCurrentFetch",
            "clearCurrentAborter",
            "clearCurrentFetch"
          ]
        },
        RESET: {
          target: [".request.checking", ".response.checking"],
          actions: [
            "clearData",
            "clearTimestamp",
            "abortCurrentFetch",
            "clearCurrentAborter",
            "clearCurrentFetch"
          ]
        }
      }
    },
    {
      guards: {
        isDisabled: (e) => e.isDisabled === !0,
        shouldLoad: (e, r, d) => {
          var u, l, f, b;
          const n = P(d.state);
          return e.fetchFn !== void 0 && (n.type !== "xstate.init" || e.loadOnInvoke === !0) && (n.type !== "xstate.after(REMAINING_FRESH_TIME)#fetcher.response.fresh" || e.loadWhenStale === !0) && (n.type !== "xstate.after(AUTO_RESET_TIME)#fetcher.request.aborted" && n.type !== "xstate.after(AUTO_RESET_TIME)#fetcher.request.failed" || e.loadOnAutoReset === !0) && (n.type !== "INVALIDATE" || e.loadOnInvalidate === !0) && (n.type !== "ENABLE" || e.loadOnEnable === !0) && (n.type !== "RESET" || e.loadOnReset === !0) && (e.data === void 0 || Date.now() - e.timestamp > e.freshTime || n.type === "LOAD" && ((l = (u = n.data) == null ? void 0 : u.refresh) != null ? l : !1) || n.type === "ENABLE" && ((b = (f = n.data) == null ? void 0 : f.refresh) != null ? b : !1) || e.isInvalid === !0 || e.currentFetch !== void 0);
        },
        isFresh: (e) => e.data !== void 0 && Date.now() - e.timestamp <= e.freshTime && e.isInvalid === !1,
        isStale: (e) => e.data !== void 0 && Date.now() - e.timestamp > e.freshTime || e.isInvalid === !0,
        isLimitedFreshTime: (e) => e.freshTime !== Number.POSITIVE_INFINITY,
        isLimitedAutoResetTime: (e) => e.autoResetTime !== Number.POSITIVE_INFINITY
      },
      delays: {
        REMAINING_FRESH_TIME: (e) => e.freshTime !== Number.POSITIVE_INFINITY ? Math.max(
          e.freshTime - (Date.now() - e.timestamp),
          0
        ) : 0,
        AUTO_RESET_TIME: (e) => e.autoResetTime !== Number.POSITIVE_INFINITY ? e.autoResetTime : 0
      },
      actions: {
        setDefaultOptions: _.assign((e) => {
          var r, d, n, u, l, f, b, m, p, S, A, O, D;
          return {
            type: (r = e.type) != null ? r : "QUERY",
            timestampFn: (d = e.timestampFn) != null ? d : () => Date.now(),
            aborterFn: (n = e.aborterFn) != null ? n : () => new AbortController(),
            isInvalid: (u = e.isInvalid) != null ? u : !1,
            isDisabled: (l = e.isDisabled) != null ? l : !1,
            freshTime: (f = e.freshTime) != null ? f : Number.POSITIVE_INFINITY,
            autoResetTime: (b = e.autoResetTime) != null ? b : Number.POSITIVE_INFINITY,
            loadOnInvoke: (m = e.loadOnInvoke) != null ? m : e.type !== "MUTATION",
            loadOnInvalidate: (p = e.loadOnInvalidate) != null ? p : e.type !== "MUTATION",
            loadOnEnable: (S = e.loadOnEnable) != null ? S : e.type !== "MUTATION",
            loadOnReset: (A = e.loadOnReset) != null ? A : e.type !== "MUTATION",
            loadOnAutoReset: (O = e.loadOnAutoReset) != null ? O : e.type !== "MUTATION",
            loadWhenStale: (D = e.loadWhenStale) != null ? D : e.type !== "MUTATION"
          };
        }),
        setOptions: _.assign((e, r) => ({
          ...e,
          ...r.data
        })),
        setData: _.assign((e, r) => ({
          data: r.type === "xstate.init" ? e.initialData : r.type === "done.invoke.currentFetch" ? r.data.data : r.type === "SET_OPTIONS" && e.data === void 0 ? e.initialData : r.type === "SET_DATA" ? r.data : e.data
        })),
        clearData: _.assign((e, r) => {
          var d, n;
          return {
            data: (n = (d = r.data) == null ? void 0 : d.clear) != null && n ? void 0 : e.data
          };
        }),
        setTimestamp: _.assign((e, r, d) => {
          var n, u, l;
          return {
            timestamp: r.type === "xstate.init" && e.data !== void 0 ? (n = e.initialTimestamp) != null ? n : Date.now() : r.type === "done.invoke.currentFetch" ? e.data === void 0 ? void 0 : e.timestampFn(r.data) : r.type === "SET_OPTIONS" && d.state.context.data === void 0 ? (u = e.initialTimestamp) != null ? u : Date.now() : r.type === "SET_DATA" ? e.data === void 0 ? void 0 : (l = r.data.timestamp) != null ? l : Date.now() : r.type === "SET_TIMESTAMP" && e.data !== void 0 ? r.data.timestamp : e.timestamp
          };
        }),
        clearTimestamp: _.assign((e, r) => {
          var d, n;
          return {
            timestamp: (n = (d = r.data) == null ? void 0 : d.clear) != null && n ? void 0 : e.timestamp
          };
        }),
        validate: _.assign((e) => ({
          isInvalid: !1
        })),
        invalidate: _.assign((e, r, d) => ({
          isInvalid: r.type === "SET_OPTIONS" && e.fetchFn !== d.state.context.fetchFn || r.type === "INVALIDATE" ? !0 : e.isInvalid
        })),
        enable: _.assign((e) => ({
          isDisabled: !1
        })),
        disable: _.assign((e) => ({
          isDisabled: !1
        })),
        setCurrentAborter: _.assign((e) => ({
          currentAborter: e.aborterFn !== !1 && e.currentAborter === void 0 ? e.aborterFn() : e.currentAborter
        })),
        clearCurrentAborter: _.assign((e, r, d) => {
          var n, u, l, f, b, m;
          return {
            currentAborter: r.type === "done.invoke.currentFetch" || r.type === "error.platform.currentFetch" || r.type === "SET_OPTIONS" && (r.data.abort === !0 || r.data.abort === void 0 && e.fetchFn !== d.state.context.fetchFn) || r.type === "SET_DATA" && r.data.abort !== !1 || r.type === "SET_TIMESTAMP" && r.data.abort === !0 || r.type === "INVALIDATE" || r.type === "ENABLE" && ((u = (n = r.data) == null ? void 0 : n.abort) != null ? u : !1) || r.type === "DISABLE" && ((f = (l = r.data) == null ? void 0 : l.abort) != null ? f : !1) || r.type === "LOAD" && ((m = (b = r.data) == null ? void 0 : b.abort) != null ? m : !1) || r.type === "ABORT" || r.type === "RESET" ? void 0 : e.currentAborter
          };
        }),
        setCurrentFetch: _.assign((e) => ({
          currentFetch: e.currentFetch === void 0 ? e.fetchFn({ aborter: e.currentAborter }) : e.currentFetch
        })),
        clearCurrentFetch: _.assign((e, r, d) => {
          var n, u, l, f, b, m;
          return {
            currentFetch: r.type === "done.invoke.currentFetch" || r.type === "error.platform.currentFetch" || r.type === "SET_OPTIONS" && (r.data.abort === !0 || r.data.abort === void 0 && e.fetchFn !== d.state.context.fetchFn) || r.type === "SET_DATA" && r.data.abort !== !1 || r.type === "SET_TIMESTAMP" && r.data.abort === !0 || r.type === "INVALIDATE" || r.type === "ENABLE" && ((u = (n = r.data) == null ? void 0 : n.abort) != null ? u : !1) || r.type === "DISABLE" && ((f = (l = r.data) == null ? void 0 : l.abort) != null ? f : !1) || r.type === "LOAD" && ((m = (b = r.data) == null ? void 0 : b.abort) != null ? m : !1) || r.type === "ABORT" || r.type === "RESET" ? void 0 : e.currentFetch
          };
        }),
        abortCurrentFetch: (e, r, d) => {
          var n, u, l, f, b, m;
          e.currentAborter !== void 0 && (r.type === "SET_OPTIONS" && (r.data.abort === !0 || r.data.abort === void 0 && e.fetchFn !== d.state.context.fetchFn) || r.type === "SET_DATA" && r.data.abort !== !1 || r.type === "SET_TIMESTAMP" && r.data.abort === !0 || r.type === "INVALIDATE" || r.type === "ENABLE" && ((u = (n = r.data) == null ? void 0 : n.abort) != null ? u : !1) || r.type === "DISABLE" && ((f = (l = r.data) == null ? void 0 : l.abort) != null ? f : !1) || r.type === "LOAD" && ((m = (b = r.data) == null ? void 0 : b.abort) != null ? m : !1) || r.type === "ABORT" || r.type === "RESET") && e.currentAborter.abort(r);
        }
      },
      services: {
        currentFetch: (e) => () => e.currentFetch
      }
    }
  );
  return i.withContext({
    ...i.context,
    ...a
  });
};
var M = {}, x = {};
(function(a) {
  Object.defineProperty(a, "__esModule", { value: !0 });
  /*! *****************************************************************************
  	Copyright (c) Microsoft Corporation.
  
  	Permission to use, copy, modify, and/or distribute this software for any
  	purpose with or without fee is hereby granted.
  
  	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  	REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  	AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  	INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  	LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  	OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  	PERFORMANCE OF THIS SOFTWARE.
  	***************************************************************************** */
  a.__assign = function() {
    return a.__assign = Object.assign || function(u) {
      for (var l, f = 1, b = arguments.length; f < b; f++) {
        l = arguments[f];
        for (var m in l)
          Object.prototype.hasOwnProperty.call(l, m) && (u[m] = l[m]);
      }
      return u;
    }, a.__assign.apply(this, arguments);
  };
  function i(n, u) {
    var l = {};
    for (var f in n)
      Object.prototype.hasOwnProperty.call(n, f) && u.indexOf(f) < 0 && (l[f] = n[f]);
    if (n != null && typeof Object.getOwnPropertySymbols == "function")
      for (var b = 0, f = Object.getOwnPropertySymbols(n); b < f.length; b++)
        u.indexOf(f[b]) < 0 && Object.prototype.propertyIsEnumerable.call(n, f[b]) && (l[f[b]] = n[f[b]]);
    return l;
  }
  function e(n) {
    var u = typeof Symbol == "function" && Symbol.iterator, l = u && n[u], f = 0;
    if (l)
      return l.call(n);
    if (n && typeof n.length == "number")
      return {
        next: function() {
          return n && f >= n.length && (n = void 0), { value: n && n[f++], done: !n };
        }
      };
    throw new TypeError(u ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }
  function r(n, u) {
    var l = typeof Symbol == "function" && n[Symbol.iterator];
    if (!l)
      return n;
    var f = l.call(n), b, m = [], p;
    try {
      for (; (u === void 0 || u-- > 0) && !(b = f.next()).done; )
        m.push(b.value);
    } catch (S) {
      p = { error: S };
    } finally {
      try {
        b && !b.done && (l = f.return) && l.call(f);
      } finally {
        if (p)
          throw p.error;
      }
    }
    return m;
  }
  function d(n, u, l) {
    if (l || arguments.length === 2)
      for (var f = 0, b = u.length, m; f < b; f++)
        (m || !(f in u)) && (m || (m = Array.prototype.slice.call(u, 0, f)), m[f] = u[f]);
    return n.concat(m || Array.prototype.slice.call(u));
  }
  a.__read = r, a.__rest = i, a.__spreadArray = d, a.__values = e;
})(x);
var w = {};
Object.defineProperty(w, "__esModule", { value: !0 });
var Oe = ".", ge = {}, Ce = "xstate.guard", we = "";
w.DEFAULT_GUARD_TYPE = Ce;
w.EMPTY_ACTIVITY_MAP = ge;
w.STATE_DELIMITER = Oe;
w.TARGETLESS_KEY = we;
var q = {};
Object.defineProperty(q, "__esModule", { value: !0 });
var Ne = process.env.NODE_ENV === "production";
q.IS_PRODUCTION = Ne;
(function(a) {
  Object.defineProperty(a, "__esModule", { value: !0 });
  var i = x, e = w, r = q, d;
  function n(t) {
    return Object.keys(t);
  }
  function u(t, s, c) {
    c === void 0 && (c = e.STATE_DELIMITER);
    var o = p(t, c), h = p(s, c);
    return F(h) ? F(o) ? h === o : !1 : F(o) ? o in h : Object.keys(o).every(function(y) {
      return y in h ? u(o[y], h[y]) : !1;
    });
  }
  function l(t) {
    try {
      return F(t) || typeof t == "number" ? "".concat(t) : t.type;
    } catch {
      throw new Error("Events must be strings or objects with a string event.type property.");
    }
  }
  function f(t) {
    try {
      return F(t) || typeof t == "number" ? "".concat(t) : g(t) ? t.name : t.type;
    } catch {
      throw new Error("Actions must be strings or objects with a string action.type property.");
    }
  }
  function b(t, s) {
    try {
      return R(t) ? t : t.toString().split(s);
    } catch {
      throw new Error("'".concat(t, "' is not a valid state path."));
    }
  }
  function m(t) {
    return typeof t == "object" && "value" in t && "context" in t && "event" in t && "_event" in t;
  }
  function p(t, s) {
    if (m(t))
      return t.value;
    if (R(t))
      return S(t);
    if (typeof t != "string")
      return t;
    var c = b(t, s);
    return S(c);
  }
  function S(t) {
    if (t.length === 1)
      return t[0];
    for (var s = {}, c = s, o = 0; o < t.length - 1; o++)
      o === t.length - 2 ? c[t[o]] = t[o + 1] : (c[t[o]] = {}, c = c[t[o]]);
    return s;
  }
  function A(t, s) {
    for (var c = {}, o = Object.keys(t), h = 0; h < o.length; h++) {
      var y = o[h];
      c[y] = s(t[y], y, t, h);
    }
    return c;
  }
  function O(t, s, c) {
    var o, h, y = {};
    try {
      for (var v = i.__values(Object.keys(t)), T = v.next(); !T.done; T = v.next()) {
        var E = T.value, I = t[E];
        !c(I) || (y[E] = s(I, E, t));
      }
    } catch (C) {
      o = {
        error: C
      };
    } finally {
      try {
        T && !T.done && (h = v.return) && h.call(v);
      } finally {
        if (o)
          throw o.error;
      }
    }
    return y;
  }
  var D = function(t) {
    return function(s) {
      var c, o, h = s;
      try {
        for (var y = i.__values(t), v = y.next(); !v.done; v = y.next()) {
          var T = v.value;
          h = h[T];
        }
      } catch (E) {
        c = {
          error: E
        };
      } finally {
        try {
          v && !v.done && (o = y.return) && o.call(y);
        } finally {
          if (c)
            throw c.error;
        }
      }
      return h;
    };
  };
  function ee(t, s) {
    return function(c) {
      var o, h, y = c;
      try {
        for (var v = i.__values(t), T = v.next(); !T.done; T = v.next()) {
          var E = T.value;
          y = y[s][E];
        }
      } catch (I) {
        o = {
          error: I
        };
      } finally {
        try {
          T && !T.done && (h = v.return) && h.call(v);
        } finally {
          if (o)
            throw o.error;
        }
      }
      return y;
    };
  }
  function G(t) {
    if (!t)
      return [[]];
    if (F(t))
      return [[t]];
    var s = $(Object.keys(t).map(function(c) {
      var o = t[c];
      return typeof o != "string" && (!o || !Object.keys(o).length) ? [[c]] : G(t[c]).map(function(h) {
        return [c].concat(h);
      });
    }));
    return s;
  }
  function te(t) {
    var s, c, o = {};
    if (t && t.length === 1 && t[0].length === 1)
      return t[0][0];
    try {
      for (var h = i.__values(t), y = h.next(); !y.done; y = h.next())
        for (var v = y.value, T = o, E = 0; E < v.length; E++) {
          var I = v[E];
          if (E === v.length - 2) {
            T[I] = v[E + 1];
            break;
          }
          T[I] = T[I] || {}, T = T[I];
        }
    } catch (C) {
      s = {
        error: C
      };
    } finally {
      try {
        y && !y.done && (c = h.return) && c.call(h);
      } finally {
        if (s)
          throw s.error;
      }
    }
    return o;
  }
  function $(t) {
    var s;
    return (s = []).concat.apply(s, i.__spreadArray([], i.__read(t), !1));
  }
  function j(t) {
    return R(t) ? t : [t];
  }
  function z(t) {
    return t === void 0 ? [] : j(t);
  }
  function re(t, s, c) {
    var o, h;
    if (g(t))
      return t(s, c.data);
    var y = {};
    try {
      for (var v = i.__values(Object.keys(t)), T = v.next(); !T.done; T = v.next()) {
        var E = T.value, I = t[E];
        g(I) ? y[E] = I(s, c.data) : y[E] = I;
      }
    } catch (C) {
      o = {
        error: C
      };
    } finally {
      try {
        T && !T.done && (h = v.return) && h.call(v);
      } finally {
        if (o)
          throw o.error;
      }
    }
    return y;
  }
  function ne(t) {
    return /^(done|error)\./.test(t);
  }
  function ae(t) {
    return !!(t instanceof Promise || t !== null && (g(t) || typeof t == "object") && g(t.then));
  }
  function ie(t) {
    return t !== null && typeof t == "object" && "transition" in t && typeof t.transition == "function";
  }
  function se(t, s) {
    var c, o, h = i.__read([[], []], 2), y = h[0], v = h[1];
    try {
      for (var T = i.__values(t), E = T.next(); !E.done; E = T.next()) {
        var I = E.value;
        s(I) ? y.push(I) : v.push(I);
      }
    } catch (C) {
      c = {
        error: C
      };
    } finally {
      try {
        E && !E.done && (o = T.return) && o.call(T);
      } finally {
        if (c)
          throw c.error;
      }
    }
    return [y, v];
  }
  function U(t, s) {
    return A(t.states, function(c, o) {
      if (!!c) {
        var h = (F(s) ? void 0 : s[o]) || (c ? c.current : void 0);
        if (!!h)
          return {
            current: h,
            states: U(c, h)
          };
      }
    });
  }
  function oe(t, s) {
    return {
      current: s,
      states: U(t, s)
    };
  }
  function ce(t, s, c, o) {
    r.IS_PRODUCTION || a.warn(!!t, "Attempting to update undefined context");
    var h = t && c.reduce(function(y, v) {
      var T, E, I = v.assignment, C = {
        state: o,
        action: v,
        _event: s
      }, Y = {};
      if (g(I))
        Y = I(y, s.data, C);
      else
        try {
          for (var k = i.__values(Object.keys(I)), N = k.next(); !N.done; N = k.next()) {
            var Q = N.value, V = I[Q];
            Y[Q] = g(V) ? V(y, s.data, C) : V;
          }
        } catch (pe) {
          T = {
            error: pe
          };
        } finally {
          try {
            N && !N.done && (E = k.return) && E.call(k);
          } finally {
            if (T)
              throw T.error;
          }
        }
      return Object.assign({}, y, Y);
    }, t);
    return h;
  }
  a.warn = function() {
  }, r.IS_PRODUCTION || (a.warn = function(t, s) {
    var c = t instanceof Error ? t : void 0;
    if (!(!c && t) && console !== void 0) {
      var o = ["Warning: ".concat(s)];
      c && o.push(c), console.warn.apply(console, o);
    }
  });
  function R(t) {
    return Array.isArray(t);
  }
  function g(t) {
    return typeof t == "function";
  }
  function F(t) {
    return typeof t == "string";
  }
  function ue(t, s) {
    if (!!t)
      return F(t) ? {
        type: e.DEFAULT_GUARD_TYPE,
        name: t,
        predicate: s ? s[t] : void 0
      } : g(t) ? {
        type: e.DEFAULT_GUARD_TYPE,
        name: t.name,
        predicate: t
      } : t;
  }
  function fe(t) {
    try {
      return "subscribe" in t && g(t.subscribe);
    } catch {
      return !1;
    }
  }
  var W = /* @__PURE__ */ function() {
    return typeof Symbol == "function" && Symbol.observable || "@@observable";
  }(), le = (d = {}, d[W] = function() {
    return this;
  }, d[Symbol.observable] = function() {
    return this;
  }, d);
  function K(t) {
    return !!t && "__xstatenode" in t;
  }
  function de(t) {
    return !!t && typeof t.send == "function";
  }
  var he = /* @__PURE__ */ function() {
    var t = 0;
    return function() {
      return t++, t.toString(16);
    };
  }();
  function X(t, s) {
    return F(t) || typeof t == "number" ? i.__assign({
      type: t
    }, s) : t;
  }
  function ye(t, s) {
    if (!F(t) && "$$type" in t && t.$$type === "scxml")
      return t;
    var c = X(t);
    return i.__assign({
      name: c.type,
      data: c,
      $$type: "scxml",
      type: "external"
    }, s);
  }
  function be(t, s) {
    var c = j(s).map(function(o) {
      return typeof o > "u" || typeof o == "string" || K(o) ? {
        target: o,
        event: t
      } : i.__assign(i.__assign({}, o), {
        event: t
      });
    });
    return c;
  }
  function Te(t) {
    if (!(t === void 0 || t === e.TARGETLESS_KEY))
      return z(t);
  }
  function ve(t, s, c) {
    if (!r.IS_PRODUCTION) {
      var o = t.stack ? " Stacktrace was '".concat(t.stack, "'") : "";
      if (t === s)
        console.error("Missing onError handler for invocation '".concat(c, "', error was '").concat(t, "'.").concat(o));
      else {
        var h = s.stack ? " Stacktrace was '".concat(s.stack, "'") : "";
        console.error("Missing onError handler and/or unhandled exception/promise rejection for invocation '".concat(c, "'. ") + "Original error: '".concat(t, "'. ").concat(o, " Current error is '").concat(s, "'.").concat(h));
      }
    }
  }
  function me(t, s, c, o, h) {
    var y = t.options.guards, v = {
      state: h,
      cond: s,
      _event: o
    };
    if (s.type === e.DEFAULT_GUARD_TYPE)
      return ((y == null ? void 0 : y[s.name]) || s.predicate)(c, o.data, v);
    var T = y == null ? void 0 : y[s.type];
    if (!T)
      throw new Error("Guard '".concat(s.type, "' is not implemented on machine '").concat(t.id, "'."));
    return T(c, o.data, v);
  }
  function Ee(t) {
    return typeof t == "string" ? {
      type: t
    } : t;
  }
  function Ie(t, s, c) {
    var o = function() {
    }, h = typeof t == "object", y = h ? t : null;
    return {
      next: ((h ? t.next : t) || o).bind(y),
      error: ((h ? t.error : s) || o).bind(y),
      complete: ((h ? t.complete : c) || o).bind(y)
    };
  }
  function _e(t, s) {
    return "".concat(t, ":invocation[").concat(s, "]");
  }
  a.createInvokeId = _e, a.evaluateGuard = me, a.flatten = $, a.getActionType = f, a.getEventType = l, a.interopSymbols = le, a.isActor = de, a.isArray = R, a.isBehavior = ie, a.isBuiltInEvent = ne, a.isFunction = g, a.isMachine = K, a.isObservable = fe, a.isPromiseLike = ae, a.isStateLike = m, a.isString = F, a.keys = n, a.mapContext = re, a.mapFilterValues = O, a.mapValues = A, a.matchesState = u, a.nestedPath = ee, a.normalizeTarget = Te, a.partition = se, a.path = D, a.pathToStateValue = S, a.pathsToStateValue = te, a.reportUnhandledExceptionOnInvocation = ve, a.symbolObservable = W, a.toArray = z, a.toArrayStrict = j, a.toEventObject = X, a.toGuard = ue, a.toInvokeSource = Ee, a.toObserver = Ie, a.toSCXMLEvent = ye, a.toStatePath = b, a.toStatePaths = G, a.toStateValue = p, a.toTransitionConfigArray = be, a.uniqueId = he, a.updateContext = ce, a.updateHistoryStates = U, a.updateHistoryValue = oe;
})(M);
const Z = H({
  id: "interceptor",
  strict: !1,
  preserveActionOrder: !0
}), De = (a, i = {}) => {
  const e = (r, d) => {
    const n = M.isMachine(a) ? L(a) : a, { mapFn: u, autoStart: l, autoStop: f, cleanFn: b } = i;
    if (e.interpreter = n, n.parent !== void 0) {
      if (n.parent.machine !== Z)
        throw new Error(
          "Cannot proxy a machine/interpreter with an assigned parent!"
        );
    } else
      n.parent = L(Z).start();
    d((A) => n.send(A));
    let m, p, S = !1;
    return u !== void 0 && (m = n.subscribe((A) => {
      const O = u({ state: A, event: P(A) });
      O !== void 0 && r(O);
    }).unsubscribe, p = n.parent.subscribe((A) => {
      if (S) {
        const O = u({
          state: n.state,
          event: P(A)
        });
        O !== void 0 && r(O);
      }
      S = !0;
    }).unsubscribe), (l === !0 || l === void 0 && M.isMachine(a)) && n.start(), () => {
      b !== void 0 && b(), u !== void 0 && (m(), p()), (f === !0 || l === void 0 && M.isMachine(a)) && n.stop();
    };
  };
  return e;
}, Le = (a = {}) => {
  const { key: i, cache: e, synchronizations: r, cleanFn: d } = a;
  let n;
  if (e !== void 0) {
    if (e.has(i) ? n = e.get(i).fetcher : (n = L(J(a)), e.set(i, n, a)), r !== void 0) {
      const u = r.map(
        (f) => ({
          ...f,
          subscribeFn: (b) => {
            const m = f.synchronizeFn({
              ...b,
              fetcher: n,
              cache: e
            });
            m !== void 0 && n.send(m);
          }
        })
      ), l = e.subscribe(u);
      a.cleanFn = () => {
        d !== void 0 && d(), l(), e.deactivate(i);
      }, e.activate(i);
    }
  } else
    n = L(J(a));
  return De(n, { ...a, autoStart: !0 });
};
export {
  Fe as Cache,
  Me as createCache,
  J as createFetcher,
  De as createProxy,
  P as getLastEvent,
  Le as useFetcher
};
//# sourceMappingURL=xstate-fetcher.mjs.map
