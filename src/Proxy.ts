import {
  createMachine,
  interpret,
  type AnyInterpreter,
  type AnyEventObject,
  type AnyState,
  type AnyStateMachine,
  type InvokeCallback,
  type Subscription,
} from "xstate";
import { isMachine } from "xstate/lib/utils";

import { getLastEvent } from "@src/LastEvent";

const interceptor = createMachine({
  id: "interceptor",
  strict: false,
  preserveActionOrder: true,
});

const createProxy = (
  machineOrInterpreter: AnyStateMachine | AnyInterpreter,
  options: ProxyOptions = {}
): Proxy => {
  const proxy: Proxy = (sendBack, on) => {
    const interpreter = isMachine(machineOrInterpreter)
      ? interpret(machineOrInterpreter)
      : machineOrInterpreter;
    const { mapFn, autoStart, autoStop, cleanFn } = options;

    proxy.interpreter = interpreter;

    if (interpreter.parent !== undefined) {
      if ((interpreter.parent.machine as AnyStateMachine) !== interceptor) {
        throw new Error(
          "Cannot proxy a machine/interpreter with an assigned parent!"
        );
      }
    } else {
      interpreter.parent = interpret(interceptor).start() as AnyInterpreter;
    }

    on((event) => interpreter.send(event));

    let interpreterUnsubscribeFn: Subscription["unsubscribe"];
    let interceptorUnsubscribeFn: Subscription["unsubscribe"];
    let isInterceptorInitialized = false;

    if (mapFn !== undefined) {
      interpreterUnsubscribeFn = interpreter.subscribe((state) => {
        const mappedEvent = mapFn({ state, event: getLastEvent(state) });

        if (mappedEvent !== undefined) {
          sendBack(mappedEvent);
        }
      }).unsubscribe;

      interceptorUnsubscribeFn = interpreter.parent.subscribe((state) => {
        if (isInterceptorInitialized) {
          const mappedEvent = mapFn({
            state: interpreter.state,
            event: getLastEvent(state),
          });

          if (mappedEvent !== undefined) {
            sendBack(mappedEvent);
          }
        }

        isInterceptorInitialized = true;
      }).unsubscribe;
    }

    if (
      autoStart === true ||
      (autoStart === undefined && isMachine(machineOrInterpreter))
    ) {
      interpreter.start();
    }

    return () => {
      if (cleanFn !== undefined) {
        cleanFn();
      }

      if (mapFn !== undefined) {
        interpreterUnsubscribeFn();
        interceptorUnsubscribeFn();
      }

      if (
        autoStop === true ||
        (autoStart === undefined && isMachine(machineOrInterpreter))
      ) {
        interpreter.stop();
      }
    };
  };

  return proxy;
};

type Proxy = InvokeCallback & { interpreter?: AnyInterpreter };

type ProxyOptions = {
  mapFn?: MapFn;
  cleanFn?: CleanFn;

  autoStart?: boolean;
  autoStop?: boolean;
};

type MapFn = (parameters: MapFnParameters) => AnyEventObject | void;

type MapFnParameters = {
  state: AnyState;
  event: AnyEventObject;
};

type CleanFn = () => void;

export { createProxy, type Proxy, type ProxyOptions };
