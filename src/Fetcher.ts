import {
  actions,
  createMachine,
  type DoneInvokeEvent,
  type InterpreterFrom,
  type StateFrom,
} from "xstate";

import { getLastEvent } from "@src/LastEvent";

// @todo Support typing of data and aborter
const createFetcher = (options: FetcherOptions = {}) => {
  const fetcher = createMachine(
    {
      id: "fetcher",
      strict: true,
      preserveActionOrder: true,

      tsTypes: {} as import("./Fetcher.typegen").Typegen0,
      schema: {
        context: {} as Context,
        events: {} as Event,
        services: {} as ServiceEvents,
      },
      context: {},

      type: "parallel",
      states: {
        // @todo Support pending request state
        request: {
          initial: "checking",
          states: {
            checking: {
              always: [
                {
                  cond: "isDisabled",
                  target: "disabled",
                },
                {
                  cond: "shouldLoad",
                  target: "loading",
                },
                "idle",
              ],
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
                    "clearCurrentFetch",
                  ],
                },

                onError: {
                  target: "failed",
                  actions: ["clearCurrentAborter", "clearCurrentFetch"],
                },
              },
            },

            loaded: {},

            aborted: {
              after: {
                AUTO_RESET_TIME: {
                  cond: "isLimitedAutoResetTime",
                  target: "checking",
                },
              },
            },

            failed: {
              after: {
                AUTO_RESET_TIME: {
                  cond: "isLimitedAutoResetTime",
                  target: "checking",
                },
              },
            },
          },

          on: {
            LOAD: {
              target: "request.checking",
              actions: [
                "abortCurrentFetch",
                "clearCurrentAborter",
                "clearCurrentFetch",
              ],
            },

            ABORT: {
              target: "request.aborted",
              actions: [
                "abortCurrentFetch",
                "clearCurrentAborter",
                "clearCurrentFetch",
              ],
            },
          },
        },

        response: {
          initial: "checking",
          states: {
            checking: {
              always: [
                {
                  cond: "isFresh",
                  target: "fresh",
                },
                {
                  cond: "isStale",
                  target: "stale",
                },
                "none",
              ],
            },

            none: {},
            stale: {},

            fresh: {
              after: {
                //@ todo Prevent unncessary event with new substate?
                REMAINING_FRESH_TIME: {
                  cond: "isLimitedFreshTime",
                  target: ["stale", "#fetcher.request.checking"],
                },
              },
            },
          },
        },
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
            "clearCurrentFetch",
          ],
        },

        SET_DATA: {
          target: [".request.checking", ".response.checking"],
          actions: [
            "setData",
            "setTimestamp",
            "validate",
            "abortCurrentFetch",
            "clearCurrentAborter",
            "clearCurrentFetch",
          ],
        },

        SET_TIMESTAMP: {
          target: [".request.checking", ".response.checking"],
          actions: [
            "setTimestamp",
            "abortCurrentFetch",
            "clearCurrentAborter",
            "clearCurrentFetch",
          ],
        },

        INVALIDATE: {
          target: [".request.checking", ".response.checking"],
          actions: [
            "invalidate",
            "abortCurrentFetch",
            "clearCurrentAborter",
            "clearCurrentFetch",
          ],
        },

        ENABLE: {
          target: ".request.checking",
          actions: [
            "enable",
            "abortCurrentFetch",
            "clearCurrentAborter",
            "clearCurrentFetch",
          ],
        },

        DISABLE: {
          target: ".request.checking",
          actions: [
            "disable",
            "abortCurrentFetch",
            "clearCurrentAborter",
            "clearCurrentFetch",
          ],
        },

        RESET: {
          target: [".request.checking", ".response.checking"],
          actions: [
            "clearData",
            "clearTimestamp",
            "abortCurrentFetch",
            "clearCurrentAborter",
            "clearCurrentFetch",
          ],
        },
      },
    },
    {
      guards: {
        isDisabled: (context) => context.isDisabled === true,

        shouldLoad: (context, _event, meta) => {
          const event = getLastEvent<
            | Event
            | { type: "xstate.init" }
            | {
                type: "xstate.after(REMAINING_FRESH_TIME)#fetcher.response.fresh";
              }
            | {
                type: "xstate.after(AUTO_RESET_TIME)#fetcher.request.aborted";
              }
            | { type: "xstate.after(AUTO_RESET_TIME)#fetcher.request.failed" }
          >(meta.state);

          return (
            context.fetchFn !== undefined &&
            (event.type !== "xstate.init" || context.loadOnInvoke === true) &&
            (event.type !==
              "xstate.after(REMAINING_FRESH_TIME)#fetcher.response.fresh" ||
              context.loadWhenStale === true) &&
            ((event.type !==
              "xstate.after(AUTO_RESET_TIME)#fetcher.request.aborted" &&
              event.type !==
                "xstate.after(AUTO_RESET_TIME)#fetcher.request.failed") ||
              context.loadOnAutoReset === true) &&
            (event.type !== "INVALIDATE" ||
              context.loadOnInvalidate === true) &&
            (event.type !== "ENABLE" || context.loadOnEnable === true) &&
            (event.type !== "RESET" || context.loadOnReset === true) &&
            (context.data === undefined ||
              Date.now() - context.timestamp! > context.freshTime! ||
              (event.type === "LOAD" && (event.data?.refresh ?? false)) ||
              (event.type === "ENABLE" && (event.data?.refresh ?? false)) ||
              context.isInvalid === true ||
              context.currentFetch !== undefined)
          );
        },

        isFresh: (context) =>
          context.data !== undefined &&
          Date.now() - context.timestamp! <= context.freshTime! &&
          context.isInvalid === false,

        isStale: (context) =>
          (context.data !== undefined &&
            Date.now() - context.timestamp! > context.freshTime!) ||
          context.isInvalid === true,

        isLimitedFreshTime: (context) =>
          context.freshTime !== Number.POSITIVE_INFINITY,

        isLimitedAutoResetTime: (context) =>
          context.autoResetTime !== Number.POSITIVE_INFINITY,
      },

      delays: {
        REMAINING_FRESH_TIME: (context) =>
          context.freshTime !== Number.POSITIVE_INFINITY
            ? Math.max(
                context.freshTime! - (Date.now() - context.timestamp!),
                0
              )
            : 0,

        AUTO_RESET_TIME: (context) =>
          context.autoResetTime !== Number.POSITIVE_INFINITY
            ? context.autoResetTime!
            : 0,
      },

      actions: {
        setDefaultOptions: actions.assign((context) => ({
          type: context.type ?? "QUERY",

          timestampFn: context.timestampFn ?? (() => Date.now()),
          aborterFn: context.aborterFn ?? (() => new AbortController()),

          isInvalid: context.isInvalid ?? false,
          isDisabled: context.isDisabled ?? false,

          freshTime: context.freshTime ?? Number.POSITIVE_INFINITY,
          autoResetTime: context.autoResetTime ?? Number.POSITIVE_INFINITY,

          loadOnInvoke: context.loadOnInvoke ?? context.type !== "MUTATION",
          loadOnInvalidate:
            context.loadOnInvalidate ?? context.type !== "MUTATION",
          loadOnEnable: context.loadOnEnable ?? context.type !== "MUTATION",
          loadOnReset: context.loadOnReset ?? context.type !== "MUTATION",
          loadOnAutoReset:
            context.loadOnAutoReset ?? context.type !== "MUTATION",
          loadWhenStale: context.loadWhenStale ?? context.type !== "MUTATION",
        })),

        // @todo Check validity of provided option values
        setOptions: actions.assign((context, event) => ({
          ...context,
          ...event.data,
        })),

        // @todo Ignore new data if it has older timestamp
        // @todo Merge new data with old one using structural equality
        setData: actions.assign((context, event) => ({
          data:
            event.type === "xstate.init"
              ? context.initialData
              : event.type === "done.invoke.currentFetch"
              ? event.data.data
              : event.type === "SET_OPTIONS" && context.data === undefined
              ? context.initialData
              : event.type === "SET_DATA"
              ? event.data
              : context.data,
        })),

        clearData: actions.assign((context, event) => ({
          data: event.data?.clear ?? false ? undefined : context.data,
        })),

        setTimestamp: actions.assign((context, event, meta) => ({
          timestamp:
            event.type === "xstate.init" && context.data !== undefined
              ? context.initialTimestamp ?? Date.now()
              : event.type === "done.invoke.currentFetch"
              ? context.data === undefined
                ? undefined
                : context.timestampFn!(event.data)
              : event.type === "SET_OPTIONS" &&
                meta.state!.context.data === undefined
              ? context.initialTimestamp ?? Date.now()
              : event.type === "SET_DATA"
              ? context.data === undefined
                ? undefined
                : event.data.timestamp ?? Date.now()
              : event.type === "SET_TIMESTAMP" && context.data !== undefined
              ? event.data.timestamp
              : context.timestamp,
        })),

        clearTimestamp: actions.assign((context, event) => ({
          timestamp: event.data?.clear ?? false ? undefined : context.timestamp,
        })),

        validate: actions.assign((_context) => ({
          isInvalid: false,
        })),

        invalidate: actions.assign((context, event, meta) => ({
          isInvalid:
            (event.type === "SET_OPTIONS" &&
              context.fetchFn !== meta.state!.context.fetchFn) ||
            event.type === "INVALIDATE"
              ? true
              : context.isInvalid,
        })),

        enable: actions.assign((_context) => ({
          isDisabled: false,
        })),

        disable: actions.assign((_context) => ({
          isDisabled: false,
        })),

        setCurrentAborter: actions.assign((context) => ({
          currentAborter:
            context.aborterFn !== false && context.currentAborter === undefined
              ? context.aborterFn!()
              : context.currentAborter,
        })),

        clearCurrentAborter: actions.assign((context, event, meta) => ({
          currentAborter:
            event.type === "done.invoke.currentFetch" ||
            event.type === "error.platform.currentFetch" ||
            (event.type === "SET_OPTIONS" &&
              (event.data.abort === true ||
                (event.data.abort === undefined &&
                  context.fetchFn !== meta.state!.context.fetchFn))) ||
            (event.type === "SET_DATA" && event.data.abort !== false) ||
            (event.type === "SET_TIMESTAMP" && event.data.abort === true) ||
            event.type === "INVALIDATE" ||
            (event.type === "ENABLE" && (event.data?.abort ?? false)) ||
            (event.type === "DISABLE" && (event.data?.abort ?? false)) ||
            (event.type === "LOAD" && (event.data?.abort ?? false)) ||
            event.type === "ABORT" ||
            event.type === "RESET"
              ? undefined
              : context.currentAborter,
        })),

        setCurrentFetch: actions.assign((context) => ({
          currentFetch:
            context.currentFetch === undefined
              ? context.fetchFn!({ aborter: context.currentAborter! })
              : context.currentFetch,
        })),

        clearCurrentFetch: actions.assign((context, event, meta) => ({
          currentFetch:
            event.type === "done.invoke.currentFetch" ||
            event.type === "error.platform.currentFetch" ||
            (event.type === "SET_OPTIONS" &&
              (event.data.abort === true ||
                (event.data.abort === undefined &&
                  context.fetchFn !== meta.state!.context.fetchFn))) ||
            (event.type === "SET_DATA" && event.data.abort !== false) ||
            (event.type === "SET_TIMESTAMP" && event.data.abort === true) ||
            event.type === "INVALIDATE" ||
            (event.type === "ENABLE" && (event.data?.abort ?? false)) ||
            (event.type === "DISABLE" && (event.data?.abort ?? false)) ||
            (event.type === "LOAD" && (event.data?.abort ?? false)) ||
            event.type === "ABORT" ||
            event.type === "RESET"
              ? undefined
              : context.currentFetch,
        })),

        abortCurrentFetch: (context, event, meta) => {
          if (
            context.currentAborter !== undefined &&
            ((event.type === "SET_OPTIONS" &&
              (event.data.abort === true ||
                (event.data.abort === undefined &&
                  context.fetchFn !== meta.state!.context.fetchFn))) ||
              (event.type === "SET_DATA" && event.data.abort !== false) ||
              (event.type === "SET_TIMESTAMP" && event.data.abort === true) ||
              event.type === "INVALIDATE" ||
              (event.type === "ENABLE" && (event.data?.abort ?? false)) ||
              (event.type === "DISABLE" && (event.data?.abort ?? false)) ||
              (event.type === "LOAD" && (event.data?.abort ?? false)) ||
              event.type === "ABORT" ||
              event.type === "RESET")
          ) {
            context.currentAborter!.abort(event);
          }
        },
      },

      services: {
        currentFetch: (context) => () => context.currentFetch,
      },
    }
  );

  return fetcher.withContext({
    ...fetcher.context,
    ...options,
  });
};

type Machine = ReturnType<typeof createFetcher>;
type Interpreter = InterpreterFrom<Machine>;
type State = StateFrom<Machine>;

/*
@todo Add options for:
  keepPreviousData
  retrying
  loadOnInterval
  loadOnRefocus
  loadOnReconnect
*/
type Context = {
  type?: Type;

  fetchFn?: FetchFn;
  timestampFn?: TimestampFn;
  aborterFn?: AborterFn | false;

  currentFetch?: Promise<any>;
  currentAborter?: Aborter;

  data?: any;
  initialData?: any;
  placeholderData?: any;

  timestamp?: number;
  initialTimestamp?: number;

  isInvalid?: boolean;
  isDisabled?: boolean;

  freshTime?: number;
  autoResetTime?: number;

  loadOnInvoke?: boolean;
  loadOnInvalidate?: boolean;
  loadOnEnable?: boolean;
  loadOnReset?: boolean;
  loadOnAutoReset?: boolean;
  loadWhenStale?: boolean;
};

type FetcherOptions = Partial<
  Pick<
    Context,
    | "type"
    | "fetchFn"
    | "timestampFn"
    | "aborterFn"
    | "initialData"
    | "initialTimestamp"
    | "placeholderData"
    | "isInvalid"
    | "isDisabled"
    | "freshTime"
    | "autoResetTime"
    | "loadOnInvoke"
    | "loadOnInvalidate"
    | "loadOnEnable"
    | "loadOnReset"
    | "loadOnAutoReset"
    | "loadWhenStale"
  >
>;

type Type = "QUERY" | "MUTATION";

type FetchFn = (parameters: { aborter: Aborter }) => Promise<any>;
type TimestampFn = (data: any) => number;
type AborterFn = () => Aborter;

type Aborter = {
  abort: (reason: Event) => void;
  signal: any;
};

type Event =
  | SetOptionsEvent
  | SetDataEvent
  | SetTimestampEvent
  | InvalidateEvent
  | EnableEvent
  | DisableEvent
  | LoadEvent
  | AbortEvent
  | ResetEvent;

type SetOptionsEvent = {
  type: "SET_OPTIONS";
  data: FetcherOptions & { abort?: boolean };
};

type SetDataEvent = {
  type: "SET_DATA";
  data: {
    data: any;
    timestamp?: number;
    abort?: boolean;
  };
};

type SetTimestampEvent = {
  type: "SET_TIMESTAMP";
  data: {
    timestamp: number;
    abort?: boolean;
  };
};

type InvalidateEvent = { type: "INVALIDATE" };

type EnableEvent = {
  type: "ENABLE";
  data?: {
    abort?: boolean;
    refresh?: boolean;
  };
};

type DisableEvent = {
  type: "DISABLE";
  data?: { abort?: boolean };
};

type LoadEvent = {
  type: "LOAD";
  data?: {
    abort?: boolean;
    refresh?: boolean;
  };
};

type AbortEvent = {
  type: "ABORT";
  data?: { reason?: any };
};

type ResetEvent = {
  type: "RESET";
  data?: { clear?: boolean };
};

type ServiceEvents = { currentFetch: CurrentFetchServiceEvent };
type CurrentFetchServiceEvent = DoneInvokeEvent<{ data: any }>;

export {
  createFetcher,
  type AborterFn,
  type Aborter,
  type Context,
  type Event,
  type FetchFn,
  type FetcherOptions,
  type Interpreter,
  type Machine,
  type State,
  type TimestampFn,
  type Type,
};
