import { cloneDeep } from "lodash-es";
import { expect, test, vi } from "vitest";
import { interpret } from "xstate";

import { createFetcher, type FetcherState, type Event } from "@src/Fetcher";

test("Starts at correct states", () => {
  const fetcher = createFetcher();

  expect(fetcher.initialState.value).toEqual({
    request: "idle",
    response: "none",
  });
});

test("Starts with initial data and timestamp from options", () =>
  new Promise<void>((resolveTest, rejectTest) => {
    const mockTransitionListener = vi.fn(
      (_state: FetcherState, _event: Event) => {}
    );

    const testFetcher = interpret(
      createFetcher({
        initialData: "Test",
        initialTimestamp: 1986,
      })
    );

    testFetcher
      .onTransition((state, event) => {
        try {
          mockTransitionListener(cloneDeep(state), event);
          const { calls: transitionCalls } = mockTransitionListener.mock;

          if (transitionCalls.length === 1) {
            expect(transitionCalls[0][0].context.data).toBe("Test");
            expect(transitionCalls[0][0].context.timestamp).toBe(1986);

            testFetcher.stop();
            resolveTest();
          }
        } catch (error) {
          testFetcher.stop();
          rejectTest(error);
        }
      })
      .start();
  }));

test("Sets initial data and timestamp after setting options", () =>
  new Promise<void>((resolveTest, rejectTest) => {
    const mockTransitionListener = vi.fn(
      (_state: FetcherState, _event: Event) => {}
    );
    const testFetcher = interpret(createFetcher());

    testFetcher
      .onTransition((state, event) => {
        try {
          mockTransitionListener(cloneDeep(state), event);
          const { calls: transitionCalls } = mockTransitionListener.mock;

          if (transitionCalls.length === 2) {
            expect(transitionCalls[1][0].context.data).toBe("Test");
            expect(transitionCalls[1][0].context.timestamp).toBe(1986);

            testFetcher.stop();
            resolveTest();
          }
        } catch (error) {
          testFetcher.stop();
          rejectTest(error);
        }
      })
      .start()
      .send({
        type: "SET_OPTIONS",
        data: {
          initialData: "Test",
          initialTimestamp: 1986,
        },
      });
  }));

test("Loads initial data from requester without timestamper", () =>
  new Promise<void>((resolveTest, rejectTest) => {
    const mockTransitionListener = vi.fn(
      (_state: FetcherState, _event: Event) => {}
    );

    const testFetcher = interpret(
      createFetcher({
        fetchFn: () =>
          new Promise((resolveRequest) => {
            setTimeout(() => resolveRequest({ data: "Test", timestamp: 1986 }));
          }),
      })
    );

    testFetcher
      .onTransition((state, event) => {
        try {
          mockTransitionListener(cloneDeep(state), event);
          const { calls: transitionCalls } = mockTransitionListener.mock;

          if (transitionCalls.length === 2) {
            expect(transitionCalls[0][0].value).toEqual({
              request: "loading",
              response: "none",
            });
            expect(transitionCalls[1][0].value).toEqual({
              request: "loaded",
              response: "fresh",
            });
            expect(transitionCalls[1][0].context.data!).toBe("Test");
            expect(transitionCalls[1][0].context.timestamp!).not.toBe(1986);

            testFetcher.stop();
            resolveTest();
          }
        } catch (error) {
          testFetcher.stop();
          rejectTest(error);
        }
      })
      .start();
  }));

test("Loads initial data from requester with timestamper", () =>
  new Promise<void>((resolveTest, rejectTest) => {
    const mockTransitionListener = vi.fn(
      (_state: FetcherState, _event: Event) => {}
    );

    const testFetcher = interpret(
      createFetcher({
        fetchFn: () =>
          new Promise((resolveRequest) => {
            setTimeout(() => resolveRequest({ data: "Test", timestamp: 1986 }));
          }),
        timestampFn: (data) => data.timestamp,
      })
    );

    testFetcher
      .onTransition((state, event) => {
        try {
          mockTransitionListener(cloneDeep(state), event);
          const { calls: transitionCalls } = mockTransitionListener.mock;

          if (transitionCalls.length === 2) {
            expect(transitionCalls[0][0].value).toEqual({
              request: "loading",
              response: "none",
            });
            expect(transitionCalls[1][0].value).toEqual({
              request: "loaded",
              response: "fresh",
            });
            expect(transitionCalls[1][0].context.data!).toBe("Test");
            expect(transitionCalls[1][0].context.timestamp!).toBe(1986);

            testFetcher.stop();
            resolveTest();
          }
        } catch (error) {
          testFetcher.stop();
          rejectTest(error);
        }
      })
      .start();
  }));

test("Reloads data when stale", () =>
  new Promise<void>((resolveTest, rejectTest) => {
    const mockTransitionListener = vi.fn(
      (_state: FetcherState, _event: Event) => {}
    );

    const testFetcher = interpret(
      createFetcher({
        fetchFn: () =>
          new Promise((resolveRequest) => {
            setTimeout(() => resolveRequest({ data: Date.now() }));
          }),
        freshTime: 10,
      })
    );

    testFetcher
      .onTransition((state, event) => {
        try {
          mockTransitionListener(state, event);
          const { calls: transitionCalls } = mockTransitionListener.mock;

          if (transitionCalls.length === 6) {
            expect(transitionCalls[2][0].value).toEqual({
              request: "loading",
              response: "stale",
            });
            expect(transitionCalls[3][0].value).toEqual({
              request: "loaded",
              response: "fresh",
            });
            expect(
              transitionCalls[3][0].context.data! -
                transitionCalls[2][0].context.data!
            ).toBeGreaterThanOrEqual(10);

            expect(transitionCalls[4][0].value).toEqual({
              request: "loading",
              response: "stale",
            });
            expect(transitionCalls[5][0].value).toEqual({
              request: "loaded",
              response: "fresh",
            });
            expect(
              transitionCalls[5][0].context.data! -
                transitionCalls[4][0].context.data!
            ).toBeGreaterThanOrEqual(10);

            testFetcher.stop();
            resolveTest();
          }
        } catch (error) {
          testFetcher.stop();
          rejectTest(error);
        }
      })
      .start();
  }));

test("Reloads data when invalidated", () =>
  new Promise<void>((resolveTest, rejectTest) => {
    const mockRequester = vi.fn(
      () =>
        new Promise((resolveRequest) => {
          setTimeout(() => resolveRequest({ data: "Test" }), 10);
        })
    );
    const mockTransitionListener = vi.fn(
      (_state: FetcherState, _event: Event) => {}
    );

    const testFetcher = interpret(createFetcher({ fetchFn: mockRequester }));

    testFetcher
      .onTransition((state, event) => {
        try {
          mockTransitionListener(cloneDeep(state), event);
          const { calls: transitionCalls } = mockTransitionListener.mock;

          if (transitionCalls.length === 2) {
            testFetcher.send({ type: "INVALIDATE" });
          } else if (transitionCalls.length === 4) {
            expect(transitionCalls[2][0].value).toEqual({
              request: "loading",
              response: "stale",
            });
            expect(transitionCalls[3][0].value).toEqual({
              request: "loaded",
              response: "fresh",
            });
            expect(mockRequester.mock.calls.length).toBe(2);

            testFetcher.stop();
            resolveTest();
          }
        } catch (error) {
          testFetcher.stop();
          rejectTest(error);
        }
      })
      .start();
  }));

test("Reloads data from new requester after setting options", () =>
  new Promise<void>((resolveTest, rejectTest) => {
    const mockTransitionListener = vi.fn(
      (_state: FetcherState, _event: Event) => {}
    );

    const testFetcher = interpret(
      createFetcher({
        fetchFn: () =>
          new Promise((resolveRequest) => {
            setTimeout(() => resolveRequest({ data: "Test 1" }));
          }),
      })
    );

    testFetcher
      .onTransition((state, event) => {
        try {
          mockTransitionListener(cloneDeep(state), event);
          const { calls: transitionCalls } = mockTransitionListener.mock;

          if (transitionCalls.length === 2) {
            testFetcher.send({
              type: "SET_OPTIONS",
              data: {
                fetchFn: () =>
                  new Promise((resolveRequest) => {
                    setTimeout(() => resolveRequest({ data: "Test 2" }));
                  }),
              },
            });
          } else if (transitionCalls.length === 4) {
            expect(transitionCalls[2][0].value).toEqual({
              request: "loading",
              response: "stale",
            });
            expect(transitionCalls[3][0].value).toEqual({
              request: "loaded",
              response: "fresh",
            });
            expect(transitionCalls[3][0].context.data!).toBe("Test 2");

            testFetcher.stop();
            resolveTest();
          }
        } catch (error) {
          testFetcher.stop();
          rejectTest(error);
        }
      })
      .start();
  }));

test("Deduplicates loading requests when not forced", () =>
  new Promise<void>((resolveTest, rejectTest) => {
    const mockRequester = vi.fn(
      () =>
        new Promise((resolveRequest) => {
          setTimeout(() => resolveRequest({ data: "Test" }), 10);
        })
    );
    const mockTransitionListener = vi.fn(
      (_state: FetcherState, _event: Event) => {}
    );

    const testFetcher = interpret(createFetcher({ fetchFn: mockRequester }));

    testFetcher
      .onTransition((state, event) => {
        try {
          mockTransitionListener(cloneDeep(state), event);
          const { calls: transitionCalls } = mockTransitionListener.mock;

          if (transitionCalls.length === 1) {
            testFetcher.send({ type: "LOAD" });
          } else if (transitionCalls.length === 3) {
            expect(transitionCalls[0][0].value).toEqual({
              request: "loading",
              response: "none",
            });
            expect(transitionCalls[1][0].value).toEqual({
              request: "loading",
              response: "none",
            });
            expect(transitionCalls[2][0].value).toEqual({
              request: "loaded",
              response: "fresh",
            });
            expect(mockRequester.mock.calls.length).toBe(1);

            testFetcher.stop();
            resolveTest();
          }
        } catch (error) {
          testFetcher.stop();
          rejectTest(error);
        }
      })
      .start();
  }));

test("Duplicates loading requests when forced", () =>
  new Promise<void>((resolveTest, rejectTest) => {
    const mockRequester = vi.fn(
      () =>
        new Promise((resolveRequest) => {
          setTimeout(() => resolveRequest({ data: "Test" }), 10);
        })
    );
    const mockTransitionListener = vi.fn(
      (_state: FetcherState, _event: Event) => {}
    );

    const testFetcher = interpret(createFetcher({ fetchFn: mockRequester }));

    testFetcher
      .onTransition((state, event) => {
        try {
          mockTransitionListener(cloneDeep(state), event);
          const { calls: transitionCalls } = mockTransitionListener.mock;

          if (transitionCalls.length === 1) {
            testFetcher.send({ type: "LOAD", data: { abort: true } });
          } else if (transitionCalls.length === 3) {
            expect(transitionCalls[0][0].value).toEqual({
              request: "loading",
              response: "none",
            });
            expect(transitionCalls[1][0].value).toEqual({
              request: "loading",
              response: "none",
            });
            expect(transitionCalls[2][0].value).toEqual({
              request: "loaded",
              response: "fresh",
            });
            expect(mockRequester.mock.calls.length).toBe(2);

            testFetcher.stop();
            resolveTest();
          }
        } catch (error) {
          testFetcher.stop();
          rejectTest(error);
        }
      })
      .start();
  }));

test("Aborts loading requests manually", () =>
  new Promise<void>((resolveTest, rejectTest) => {
    const mockSignalListener = vi.fn(
      (rejectRequest: (reason: FetcherState) => void, reason: FetcherState) =>
        rejectRequest(reason)
    );
    const mockTransitionListener = vi.fn(
      (_state: FetcherState, _event: Event) => {}
    );

    const testFetcher = interpret(
      createFetcher({
        fetchFn: ({ aborter: { signal } }) =>
          new Promise((_resolveRequest, rejectRequest) => {
            signal.addEventListener(
              "abort",
              () => mockSignalListener(rejectRequest, signal.reason),
              { once: true }
            );
          }),
      })
    );

    testFetcher
      .onTransition((state, event) => {
        try {
          mockTransitionListener(cloneDeep(state), event);
          const { calls: transitionCalls } = mockTransitionListener.mock;
          const { calls: signalCalls } = mockSignalListener.mock;

          if (transitionCalls.length === 1) {
            testFetcher.send({ type: "ABORT" });
          } else if (transitionCalls.length === 2) {
            expect(transitionCalls[1][0].value).toEqual({
              request: "aborted",
              response: "none",
            });
            expect(signalCalls.length).toBe(1);
            expect(signalCalls[0][1]).toEqual({ type: "ABORT" });

            testFetcher.stop();
            resolveTest();
          }
        } catch (error) {
          testFetcher.stop();
          rejectTest(error);
        }
      })
      .start();
  }));

test("Loads only manually when fetcher type is mutation", () =>
  new Promise<void>((resolveTest, rejectTest) => {
    const mockTransitionListener = vi.fn(
      (_state: FetcherState, _event: Event) => {}
    );

    const testFetcher = interpret(
      createFetcher({
        type: "MUTATION",
        fetchFn: () =>
          new Promise((resolveRequest) => {
            setTimeout(() => resolveRequest({ data: "Test" }));
          }),
      })
    );

    testFetcher
      .onTransition((state, event) => {
        try {
          mockTransitionListener(cloneDeep(state), event);
          const { calls: transitionCalls } = mockTransitionListener.mock;

          if (transitionCalls.length === 1) {
            testFetcher.send({ type: "LOAD" });
          } else if (transitionCalls.length === 3) {
            expect(transitionCalls[0][0].value).toEqual({
              request: "idle",
              response: "none",
            });
            expect(transitionCalls[0][0].context.data).toBeUndefined();

            expect(transitionCalls[2][0].value).toEqual({
              request: "loaded",
              response: "fresh",
            });
            expect(transitionCalls[2][0].context.data).toBe("Test");

            testFetcher.stop();
            resolveTest();
          }
        } catch (error) {
          testFetcher.stop();
          rejectTest(error);
        }
      })
      .start();
  }));
