import { AnyState } from "xstate";

const getLastEvent = <TEvents>(state: AnyState): TEvents =>
  state.event.type !== ""
    ? state.event
    : state.history !== undefined
    ? getLastEvent(state.history)
    : undefined;

export { getLastEvent };
