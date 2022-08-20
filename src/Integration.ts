import { interpret } from "xstate";

import {
  Cache,
  type Key,
  type CacheOptions,
  type Subscription,
  type SubscribeFnParameters,
} from "@src/Cache";

import {
  createFetcher,
  type Event,
  type Interpreter,
  type FetcherOptions,
} from "@src/Fetcher";

import { createProxy, type ProxyOptions, type Proxy } from "@src/Proxy";

const useFetcher = (options: Options = {}): Proxy => {
  const { key, cache, synchronizations, cleanFn } = options;

  let fetcher: Interpreter;

  if (cache !== undefined) {
    if (cache.has(key)) {
      fetcher = cache.get(key).fetcher;
    } else {
      fetcher = interpret(createFetcher(options));

      cache.set(key, fetcher, options);
    }

    if (synchronizations !== undefined) {
      const subscriptions = synchronizations.map<Subscription>(
        (synchronization) => ({
          ...synchronization,
          subscribeFn: (parameters) => {
            const synchronizationEvent = synchronization.synchronizeFn({
              ...parameters,
              fetcher,
              cache,
            });

            if (synchronizationEvent !== undefined) {
              fetcher.send(synchronizationEvent);
            }
          },
        })
      );

      const unsubscribeFn = cache.subscribe(subscriptions);

      options.cleanFn = () => {
        if (cleanFn !== undefined) {
          cleanFn();
        }

        unsubscribeFn();

        cache.deactivate(key);
      };

      cache.activate(key);
    }
  } else {
    fetcher = interpret(createFetcher(options));
  }

  return createProxy(fetcher, { ...options, autoStart: true });
};

type Options = FetcherOptions &
  CacheOptions &
  Pick<ProxyOptions, "mapFn" | "cleanFn"> & {
    key?: Key;
    cache?: Cache;
    synchronizations?: Synchronization[];
  };

type Synchronization = Omit<Subscription, "subscribeFn"> & {
  synchronizeFn: SynchronizeFn;
};

type SynchronizeFn = (parameters: SynchronizeFnParameters) => Event | void;

type SynchronizeFnParameters = SubscribeFnParameters & {
  fetcher: Interpreter;
  cache: Cache;
};

export {
  useFetcher,
  type Options,
  type Synchronization,
  type SynchronizeFn,
  type SynchronizeFnParameters,
};
