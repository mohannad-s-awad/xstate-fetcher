import { cloneDeep } from "lodash-es";
import { expect, test, vi } from "vitest";
import {
  actions,
  createMachine,
  interpret,
  EventFrom,
  StateFrom,
} from "xstate";

import { createProxy } from "@src/Proxy";

test("Forwards events to proxied machine", () =>
  new Promise<void>((resolveTest, rejectTest) => {
    const proxiedMachine = interpret(
      createMachine(
        {
          id: "proxiedMachine",
          strict: true,
          preserveActionOrder: true,

          initial: "idle",
          states: {
            idle: {
              on: {
                START: "working",
              },
            },

            working: {
              entry: "finish",

              on: {
                DONE: "done",
              },
            },

            done: {},
          },
        },
        {
          actions: {
            finish: actions.send({ type: "DONE" }),
          },
        }
      )
    );

    const testMachine = interpret(
      createMachine(
        {
          id: "testMachine",
          strict: true,
          preserveActionOrder: true,

          initial: "idle",
          states: {
            idle: {
              entry: "startProxiedMachine",

              on: {
                PROXIED_DONE: "done",
              },
            },

            done: {},
          },

          invoke: {
            id: "proxy",
            src: "proxy",
          },
        },
        {
          actions: {
            startProxiedMachine: actions.send(
              { type: "START" },
              { to: "proxy" }
            ),
          },

          services: {
            proxy: () =>
              createProxy(proxiedMachine, {
                mapFn: ({ state }) => {
                  if (state.matches("request.loaded")) {
                    return { type: "PROXIED_DONE" };
                  }
                },
              }),
          },
        }
      )
    );

    const mockProxiedMachineTransitionListener = vi.fn(
      (
        _state: StateFrom<typeof proxiedMachine.machine>,
        _event: EventFrom<typeof proxiedMachine.machine>
      ) => {}
    );

    proxiedMachine
      .onTransition((state, event) => {
        try {
          mockProxiedMachineTransitionListener(cloneDeep(state), event);
          const { calls: transitionCalls } =
            mockProxiedMachineTransitionListener.mock;

          if (transitionCalls.length === 3) {
            expect(transitionCalls[1][0].value).toBe("working");
            expect(transitionCalls[2][0].value).toBe("done");

            proxiedMachine.stop();
            resolveTest();
          }
        } catch (error) {
          proxiedMachine.stop();
          rejectTest(error);
        }
      })
      .start();

    const mockTestMachineTransitionListener = vi.fn(
      (
        _state: StateFrom<typeof proxiedMachine.machine>,
        _event: EventFrom<typeof proxiedMachine.machine>
      ) => {}
    );

    testMachine
      .onTransition((state, event) => {
        try {
          mockTestMachineTransitionListener(cloneDeep(state), event);
          const { calls: transitionCalls } =
            mockTestMachineTransitionListener.mock;

          if (transitionCalls.length === 2) {
            expect(transitionCalls[1][0].value).toBe("done");
            expect(transitionCalls[1][1].type).toBe("PROXIED_DONE");

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

test("Forwards parent events from proxied machine", () =>
  new Promise<void>((resolveTest, rejectTest) => {
    const proxiedMachine = interpret(
      createMachine(
        {
          id: "proxiedMachine",
          strict: true,
          preserveActionOrder: true,

          initial: "idle",
          states: {
            idle: {
              after: {
                10: {
                  actions: "notifyParent",
                },
              },
            },
          },
        },
        {
          actions: {
            notifyParent: actions.sendParent({ type: "NOTIFY" }),
          },
        }
      )
    );

    const testMachine = interpret(
      createMachine(
        {
          id: "testMachine",
          strict: true,
          preserveActionOrder: true,

          initial: "idle",
          states: {
            idle: {
              on: {
                PROXIED_NOTIFY: "done",
              },
            },

            done: {},
          },

          invoke: {
            id: "proxy",
            src: "proxy",
          },
        },
        {
          services: {
            proxy: () =>
              createProxy(proxiedMachine, {
                mapFn: ({ event }) => {
                  if (event.type === "NOTIFY") {
                    return { type: "PROXIED_NOTIFY" };
                  }
                },
              }),
          },
        }
      )
    );

    proxiedMachine.start();

    const mockTestMachineTransitionListener = vi.fn(
      (
        _state: StateFrom<typeof proxiedMachine.machine>,
        _event: EventFrom<typeof proxiedMachine.machine>
      ) => {}
    );

    testMachine
      .onTransition((state, event) => {
        try {
          mockTestMachineTransitionListener(cloneDeep(state), event);
          const { calls: transitionCalls } =
            mockTestMachineTransitionListener.mock;

          if (transitionCalls.length === 2) {
            expect(transitionCalls[1][0].value).toBe("done");
            expect(transitionCalls[1][1].type).toBe("PROXIED_NOTIFY");

            proxiedMachine.stop();
            testMachine.stop();
            resolveTest();
          }
        } catch (error) {
          proxiedMachine.stop();
          testMachine.stop();
          rejectTest(error);
        }
      })
      .start();
  }));
