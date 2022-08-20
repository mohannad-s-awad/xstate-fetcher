import { type Interpreter, type State } from "@src/Fetcher";

const createCache = () => new Cache();

class Cache {
  private _entries: Entry[] = [];
  private _subscriptions: Subscription[] = [];

  public has(key: Key): boolean {
    return this._findIndex(key) !== -1;
  }

  // @todo Disable fetcher if not set to keep active?
  public set(key: Key, fetcher: Interpreter, options: CacheOptions = {}): void {
    const entryIndex = this._findIndex(key);

    if (entryIndex !== -1) {
      this._remove(entryIndex);
    }

    const { cacheTime, keepActive } = options;
    const entry: Entry = {
      key,
      fetcher,

      cacheTime: cacheTime ?? Number.POSITIVE_INFINITY,

      activatorsCount: 0,
      keepActive: keepActive ?? false,

      subscribeFns: [],
      unsubscribeFn: () => {},
    };

    entry.subscribeFns = this._filterSubscribeFns(this._subscriptions, entry);
    entry.unsubscribeFn = fetcher.subscribe((state) =>
      this._notifySubscribeFns(state, entry)
    ).unsubscribe;

    this._entries.push(entry);
  }

  public get(key: Key): ReadonlyEntry {
    const entryIndex = this._findIndex(key);

    if (entryIndex === -1) {
      throw new Error("Cannot find an entry with this key!");
    }

    return this._entries[entryIndex];
  }

  public remove(key: Key): void {
    const entryIndex = this._findIndex(key);

    if (entryIndex === -1) {
      throw new Error("Cannot find an entry with this key!");
    }

    this._remove(entryIndex);
  }

  public setCacheTime(key: Key, cacheTime: number): void {
    const entryIndex = this._findIndex(key);

    if (entryIndex === -1) {
      throw new Error("Cannot find an entry with this key!");
    }

    this._setCacheTime(entryIndex, cacheTime);
  }

  public getCacheTime(key: Key): number {
    const entryIndex = this._findIndex(key);

    if (entryIndex === -1) {
      throw new Error("Cannot find an entry with this key!");
    }

    const entry = this._entries[entryIndex];

    return entry.cacheTime;
  }

  public setKeepActive(key: Key, keepActive: boolean): void {
    const entryIndex = this._findIndex(key);

    if (entryIndex === -1) {
      throw new Error("Cannot find an entry with this key!");
    }

    const entry = this._entries[entryIndex];

    if (keepActive && !entry.keepActive && entry.activatorsCount === 0) {
      entry.fetcher.send({ type: "ENABLE" });
    }

    entry.keepActive = keepActive;
  }

  public getKeepActive(key: Key): boolean {
    const entryIndex = this._findIndex(key);

    if (entryIndex === -1) {
      throw new Error("Cannot find an entry with this key!");
    }

    const entry = this._entries[entryIndex];

    return entry.keepActive;
  }

  public activate(key: Key): void {
    const entryIndex = this._findIndex(key);

    if (entryIndex === -1) {
      throw new Error("Cannot find an entry with this key!");
    }

    const entry = this._entries[entryIndex];

    if (++entry.activatorsCount === 1 && entry.cacheTimeout !== undefined) {
      clearTimeout(entry.cacheTimeout);
    }
  }

  public deactivate(key: Key): void {
    const entryIndex = this._findIndex(key);

    if (entryIndex === -1) {
      throw new Error("Cannot find an entry with this key!");
    }

    const entry = this._entries[entryIndex];

    if (--entry.activatorsCount === 0) {
      if (entry.cacheTime !== Number.POSITIVE_INFINITY) {
        entry.cacheTimeout = setTimeout(() => {
          entry.cacheTimeout = undefined;

          this._remove(entryIndex);
        }, entry.cacheTime);
      }

      if (!entry.keepActive) {
        entry.fetcher.send({ type: "DISABLE" });
      }
    }
  }

  public filter(key: Key, options?: FilterOptions): ReadonlyEntry[] {
    return this._entries.filter(
      (entry) =>
        this._matchKeys(entry.key, key, options?.isExact) &&
        (options?.predicateFn === undefined || options.predicateFn(entry))
    );
  }

  public batch(key: Key, batchFn: BatchFn, options?: FilterOptions): void {
    this.filter(key, options).forEach(batchFn);
  }

  public subscribe(subscriptions: Subscription[]): UnsubscribeFn {
    this._subscriptions.push(...subscriptions);

    this._entries.forEach((entry) => {
      entry.subscribeFns.push(
        ...this._filterSubscribeFns(subscriptions, entry)
      );
    });

    return () =>
      subscriptions.forEach((subscription) => {
        const subscriptionIndex = this._subscriptions.indexOf(subscription);

        this._subscriptions.splice(subscriptionIndex, 1);

        this._entries.forEach((entry) => {
          const subscribeFnIndex = entry.subscribeFns.indexOf(
            subscription.subscribeFn
          );

          entry.subscribeFns.splice(subscribeFnIndex, 1);
        });
      });
  }

  private _findIndex(key: Key): number {
    return this._entries.findIndex((entry) =>
      this._matchKeys(entry.key, key, true)
    );
  }

  private _matchKeys(
    sourceKey: Key,
    targetKey: Key,
    isExact: boolean = false
  ): boolean {
    if (sourceKey === targetKey) {
      return true;
    }

    if (
      typeof sourceKey === "object" &&
      sourceKey !== null &&
      typeof targetKey === "object" &&
      targetKey !== null
    ) {
      const sourceKeyKeys = Object.keys(sourceKey);
      const targetKeyKeys = Object.keys(targetKey);

      if (!isExact || sourceKeyKeys.length === targetKeyKeys.length) {
        return (isExact ? sourceKeyKeys : targetKeyKeys).every((key) =>
          this._matchKeys(
            Array.isArray(sourceKey) ? sourceKey[Number(key)] : sourceKey[key],
            Array.isArray(targetKey) ? targetKey[Number(key)] : targetKey[key],
            isExact
          )
        );
      }
    }

    return false;
  }

  private _setCacheTime(entryIndex: number, cacheTime: number): void {
    if (cacheTime < 0) {
      throw new Error("Cannot set the cache time to a negative number!");
    }

    const entry = this._entries[entryIndex];

    if (entry.cacheTimeout !== undefined) {
      clearTimeout(entry.cacheTimeout);

      entry.cacheTimeout =
        cacheTime !== Number.POSITIVE_INFINITY
          ? setTimeout(
              () => {
                entry.cacheTimeout = undefined;

                this._remove(entryIndex);
              },
              entry.cacheTime !== Number.POSITIVE_INFINITY
                ? Math.max(cacheTime - entry.cacheTime, 0)
                : cacheTime
            )
          : undefined;
    }

    entry.cacheTime = cacheTime;
  }

  private _filterSubscribeFns(
    subscriptions: Subscription[],
    entry: Entry
  ): SubscribeFn[] {
    return subscriptions
      .filter((subscription) =>
        (subscription.keys ?? [subscription.key]).some(
          (subscriptionKey) =>
            this._matchKeys(entry.key, subscriptionKey, subscription.isExact) &&
            (subscription.predicateFn === undefined ||
              subscription.predicateFn(entry))
        )
      )
      .map((subscription) => {
        if (entry.subscribeFns.includes(subscription.subscribeFn)) {
          throw new Error(
            "Cannot reuse a subscribe function with the same entry!"
          );
        }

        return subscription.subscribeFn;
      });
  }

  private _notifySubscribeFns(state: State, entry: Entry): void {
    entry.subscribeFns.forEach((subscribeFn) =>
      queueMicrotask(() => subscribeFn({ state, entry }))
    );
  }

  private _remove(entryIndex: number): void {
    const entry = this._entries[entryIndex];

    if (entry.activatorsCount !== 0) {
      throw new Error("Cannot remove an active entry!");
    }

    if (entry.cacheTimeout !== undefined) {
      clearTimeout(entry.cacheTimeout);

      entry.cacheTimeout = undefined;
    }

    entry.unsubscribeFn();

    this._entries.splice(entryIndex, 1);
  }
}

type Entry = {
  key: Key;
  fetcher: Interpreter;

  cacheTime: number;
  cacheTimeout?: Timeout;

  activatorsCount: number;
  keepActive: boolean;

  subscribeFns: SubscribeFn[];
  unsubscribeFn: UnsubscribeFn;
};

type ReadonlyEntry = Readonly<Omit<Entry, "cacheTimeout" | "unsubscribeFn">>;

type CacheOptions = Partial<Pick<Entry, "cacheTime" | "keepActive">>;

type Key =
  | undefined
  | null
  | boolean
  | number
  | bigint
  | string
  | symbol
  | Key[]
  | { [key: number | string | symbol]: Key };

type Timeout = ReturnType<typeof setTimeout>;

type FilterOptions = {
  isExact?: boolean;
  predicateFn?: FilterPredicateFn;
};

type FilterPredicateFn = (entry: ReadonlyEntry) => boolean;
type BatchFn = (entry: ReadonlyEntry) => void;

type Subscription = {
  key?: Key;
  keys?: Key[];
  isExact?: boolean;
  predicateFn?: FilterPredicateFn;
  subscribeFn: SubscribeFn;
};

type SubscribeFn = (parameters: SubscribeFnParameters) => void;

type SubscribeFnParameters = {
  state: State;
  entry: ReadonlyEntry;
};

type UnsubscribeFn = () => void;

export {
  createCache,
  Cache,
  type BatchFn,
  type Entry,
  type FilterOptions,
  type FilterPredicateFn,
  type Key,
  type CacheOptions,
  type ReadonlyEntry,
  type SubscribeFn,
  type SubscribeFnParameters,
  type Subscription,
  type Timeout,
  type UnsubscribeFn,
};
