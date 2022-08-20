import { cloneDeep } from "lodash-es";
import { expect, test, vi } from "vitest";

import {
  createMachine,
  interpret,
  type EventFrom,
  type StateFrom,
} from "xstate";

import { createCache } from "@src/Cache";
import { useFetcher } from "@src/Integration";
import { createFetcher } from "@src/Fetcher";

test("Integrates with other machines", () =>
  new Promise<void>((resolveTest, rejectTest) => {
    const cache = createCache();
    const testMachine = interpret(
      createMachine(
        {
          id: "testMachine",
          strict: true,
          preserveActionOrder: true,

          initial: "loading",
          states: {
            loading: {},
            loaded: {},
          },

          invoke: {
            id: "operation",
            src: "operation",
          },

          on: {
            OPERATION_LOADED: "loaded",
          },
        },
        {
          services: {
            operation: () =>
              useFetcher({
                key: "test",
                cache,
                fetchFn: () => Promise.resolve("Test"),
                mapFn: ({ state }) => {
                  if (state.matches("request.loaded")) {
                    return { type: "OPERATION_LOADED" };
                  }
                },
              }),
          },
        }
      )
    );

    const mockTransitionListener = vi.fn(
      (
        _state: StateFrom<typeof testMachine.machine>,
        _event: EventFrom<typeof testMachine.machine>
      ) => {}
    );

    testMachine
      .onTransition((state, event) => {
        try {
          mockTransitionListener(cloneDeep(state), event);
          const { calls: transitionCalls } = mockTransitionListener.mock;

          if (transitionCalls.length === 2) {
            expect(transitionCalls[1][0].value).toBe("loaded");

            testMachine.stop();
            resolveTest();
          }
        } catch (error) {
          testMachine.stop();
          rejectTest(error);
        }
      })
      .start();
  }));

test("Integrates with the cache", () =>
  new Promise<void>((resolveTest, rejectTest) => {
    const cache = createCache();
    const testMachine = interpret(
      createMachine(
        {
          id: "testMachine",
          strict: true,
          preserveActionOrder: true,

          initial: "loading",
          states: {
            loading: {},
            loaded: {},
          },

          invoke: {
            id: "query",
            src: "query",
          },

          on: {
            QUERY_LOADED: ".loaded",
          },
        },
        {
          services: {
            query: () =>
              useFetcher({
                key: "query",
                cache,
                fetchFn: () => Promise.resolve("Test"),
                mapFn: ({ state }) => {
                  if (state.matches("request.loaded")) {
                    return { type: "QUERY_LOADED" };
                  }
                },
                synchronizations: [
                  {
                    key: ["mutation"],
                    synchronizeFn: ({ state }) => {
                      if (state.matches("request.loaded")) {
                        return { type: "INVALIDATE" };
                      }
                    },
                  },
                ],
              }),
          },
        }
      )
    );

    const mockTransitionListener = vi.fn(
      (
        _state: StateFrom<typeof testMachine.machine>,
        _event: EventFrom<typeof testMachine.machine>
      ) => {}
    );

    testMachine
      .onTransition((state, event) => {
        try {
          mockTransitionListener(cloneDeep(state), event);
          const { calls: transitionCalls } = mockTransitionListener.mock;

          if (transitionCalls.length === 1) {
            const mutation1 = interpret(
              createFetcher({
                type: "MUTATION",
                fetchFn: () => Promise.resolve("OK"),
              })
            ).start();

            const mutation2 = interpret(
              createFetcher({
                type: "MUTATION",
                fetchFn: () => Promise.resolve("OK"),
              })
            ).start();

            cache.set(["mutation", 1], mutation1);
            cache.set(["mutation", 2], mutation2);

            cache.batch(["mutation"], (entry) =>
              entry.fetcher.send({ type: "LOAD" })
            );
          } else if (transitionCalls.length === 3) {
            expect(transitionCalls[1][0].value).toBe("loaded");
            expect(transitionCalls[2][0].value).toBe("loaded");

            testMachine.stop();
            resolveTest();
          }
        } catch (error) {
          testMachine.stop();
          rejectTest(error);
        }
      })
      .start();
  }));
