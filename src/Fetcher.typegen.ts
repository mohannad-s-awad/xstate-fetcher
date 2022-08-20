// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.currentFetch": {
      type: "done.invoke.currentFetch";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.currentFetch": {
      type: "error.platform.currentFetch";
      data: unknown;
    };
    "xstate.after(AUTO_RESET_TIME)#fetcher.request.aborted": {
      type: "xstate.after(AUTO_RESET_TIME)#fetcher.request.aborted";
    };
    "xstate.after(AUTO_RESET_TIME)#fetcher.request.failed": {
      type: "xstate.after(AUTO_RESET_TIME)#fetcher.request.failed";
    };
    "xstate.after(REMAINING_FRESH_TIME)#fetcher.response.fresh": {
      type: "xstate.after(REMAINING_FRESH_TIME)#fetcher.response.fresh";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    currentFetch: "done.invoke.currentFetch";
  };
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingActions: {
    abortCurrentFetch:
      | "ABORT"
      | "DISABLE"
      | "ENABLE"
      | "INVALIDATE"
      | "LOAD"
      | "RESET"
      | "SET_DATA"
      | "SET_OPTIONS"
      | "SET_TIMESTAMP";
    clearCurrentAborter:
      | "ABORT"
      | "DISABLE"
      | "ENABLE"
      | "INVALIDATE"
      | "LOAD"
      | "RESET"
      | "SET_DATA"
      | "SET_OPTIONS"
      | "SET_TIMESTAMP"
      | "done.invoke.currentFetch"
      | "error.platform.currentFetch";
    clearCurrentFetch:
      | "ABORT"
      | "DISABLE"
      | "ENABLE"
      | "INVALIDATE"
      | "LOAD"
      | "RESET"
      | "SET_DATA"
      | "SET_OPTIONS"
      | "SET_TIMESTAMP"
      | "done.invoke.currentFetch"
      | "error.platform.currentFetch";
    clearData: "RESET";
    clearTimestamp: "RESET";
    disable: "DISABLE";
    enable: "ENABLE";
    invalidate: "INVALIDATE" | "SET_OPTIONS";
    setCurrentAborter: "";
    setCurrentFetch: "";
    setData:
      | "SET_DATA"
      | "SET_OPTIONS"
      | "done.invoke.currentFetch"
      | "xstate.init";
    setDefaultOptions: "SET_OPTIONS" | "xstate.init";
    setOptions: "SET_OPTIONS";
    setTimestamp:
      | "SET_DATA"
      | "SET_OPTIONS"
      | "SET_TIMESTAMP"
      | "done.invoke.currentFetch"
      | "xstate.init";
    validate: "SET_DATA" | "done.invoke.currentFetch";
  };
  eventsCausingServices: {
    currentFetch: "";
  };
  eventsCausingGuards: {
    isDisabled: "";
    isFresh: "";
    isLimitedAutoResetTime:
      | "xstate.after(AUTO_RESET_TIME)#fetcher.request.aborted"
      | "xstate.after(AUTO_RESET_TIME)#fetcher.request.failed";
    isLimitedFreshTime: "xstate.after(REMAINING_FRESH_TIME)#fetcher.response.fresh";
    isStale: "";
    shouldLoad: "";
  };
  eventsCausingDelays: {
    AUTO_RESET_TIME: "ABORT" | "error.platform.currentFetch";
    REMAINING_FRESH_TIME: "";
  };
  matchesStates:
    | "request"
    | "request.aborted"
    | "request.checking"
    | "request.disabled"
    | "request.failed"
    | "request.idle"
    | "request.loaded"
    | "request.loading"
    | "response"
    | "response.checking"
    | "response.fresh"
    | "response.none"
    | "response.stale"
    | {
        request?:
          | "aborted"
          | "checking"
          | "disabled"
          | "failed"
          | "idle"
          | "loaded"
          | "loading";
        response?: "checking" | "fresh" | "none" | "stale";
      };
  tags: never;
}
