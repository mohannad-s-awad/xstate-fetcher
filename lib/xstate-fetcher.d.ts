import { AnyEventObject, AnyInterpreter, AnyState, AnyStateMachine, DoneInvokeEvent, InterpreterFrom, InvokeCallback, StateFrom } from 'xstate';

export interface Typegen0 {
	"@@xstate/typegen": true;
	internalEvents: {
		"": {
			type: "";
		};
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
		"xstate.init": {
			type: "xstate.init";
		};
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
		abortCurrentFetch: "ABORT" | "DISABLE" | "ENABLE" | "INVALIDATE" | "LOAD" | "RESET" | "SET_DATA" | "SET_OPTIONS" | "SET_TIMESTAMP";
		clearCurrentAborter: "ABORT" | "DISABLE" | "ENABLE" | "INVALIDATE" | "LOAD" | "RESET" | "SET_DATA" | "SET_OPTIONS" | "SET_TIMESTAMP" | "done.invoke.currentFetch" | "error.platform.currentFetch";
		clearCurrentFetch: "ABORT" | "DISABLE" | "ENABLE" | "INVALIDATE" | "LOAD" | "RESET" | "SET_DATA" | "SET_OPTIONS" | "SET_TIMESTAMP" | "done.invoke.currentFetch" | "error.platform.currentFetch";
		clearData: "RESET";
		clearTimestamp: "RESET";
		disable: "DISABLE";
		enable: "ENABLE";
		invalidate: "INVALIDATE" | "SET_OPTIONS";
		setCurrentAborter: "";
		setCurrentFetch: "";
		setData: "SET_DATA" | "SET_OPTIONS" | "done.invoke.currentFetch" | "xstate.init";
		setDefaultOptions: "SET_OPTIONS" | "xstate.init";
		setOptions: "SET_OPTIONS";
		setTimestamp: "SET_DATA" | "SET_OPTIONS" | "SET_TIMESTAMP" | "done.invoke.currentFetch" | "xstate.init";
		validate: "SET_DATA" | "done.invoke.currentFetch";
	};
	eventsCausingServices: {
		currentFetch: "";
	};
	eventsCausingGuards: {
		isDisabled: "";
		isFresh: "";
		isLimitedAutoResetTime: "xstate.after(AUTO_RESET_TIME)#fetcher.request.aborted" | "xstate.after(AUTO_RESET_TIME)#fetcher.request.failed";
		isLimitedFreshTime: "xstate.after(REMAINING_FRESH_TIME)#fetcher.response.fresh";
		isStale: "";
		shouldLoad: "";
	};
	eventsCausingDelays: {
		AUTO_RESET_TIME: "ABORT" | "error.platform.currentFetch";
		REMAINING_FRESH_TIME: "";
	};
	matchesStates: "request" | "request.aborted" | "request.checking" | "request.disabled" | "request.failed" | "request.idle" | "request.loaded" | "request.loading" | "response" | "response.checking" | "response.fresh" | "response.none" | "response.stale" | {
		request?: "aborted" | "checking" | "disabled" | "failed" | "idle" | "loaded" | "loading";
		response?: "checking" | "fresh" | "none" | "stale";
	};
	tags: never;
}
export declare const createFetcher: (options?: FetcherOptions) => import("xstate").StateMachine<Context, any, SetOptionsEvent | SetDataEvent | SetTimestampEvent | InvalidateEvent | EnableEvent | DisableEvent | LoadEvent | AbortEvent | ResetEvent, {
	value: any;
	context: Context;
}, import("xstate").BaseActionObject, ServiceEvents, import("xstate").ResolveTypegenMeta<Typegen0, SetOptionsEvent | SetDataEvent | SetTimestampEvent | InvalidateEvent | EnableEvent | DisableEvent | LoadEvent | AbortEvent | ResetEvent, import("xstate").BaseActionObject, ServiceEvents>>;
export declare type Machine = ReturnType<typeof createFetcher>;
export declare type Interpreter = InterpreterFrom<Machine>;
export declare type State = StateFrom<Machine>;
export declare type Context = {
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
export declare type FetcherOptions = Partial<Pick<Context, "type" | "fetchFn" | "timestampFn" | "aborterFn" | "initialData" | "initialTimestamp" | "placeholderData" | "isInvalid" | "isDisabled" | "freshTime" | "autoResetTime" | "loadOnInvoke" | "loadOnInvalidate" | "loadOnEnable" | "loadOnReset" | "loadOnAutoReset" | "loadWhenStale">>;
export declare type Type = "QUERY" | "MUTATION";
export declare type FetchFn = (parameters: {
	aborter: Aborter;
}) => Promise<any>;
export declare type TimestampFn = (data: any) => number;
export declare type AborterFn = () => Aborter;
export declare type Aborter = {
	abort: (reason: Event) => void;
	signal: any;
};
export declare type Event = SetOptionsEvent | SetDataEvent | SetTimestampEvent | InvalidateEvent | EnableEvent | DisableEvent | LoadEvent | AbortEvent | ResetEvent;
export declare type SetOptionsEvent = {
	type: "SET_OPTIONS";
	data: FetcherOptions & {
		abort?: boolean;
	};
};
export declare type SetDataEvent = {
	type: "SET_DATA";
	data: {
		data: any;
		timestamp?: number;
		abort?: boolean;
	};
};
export declare type SetTimestampEvent = {
	type: "SET_TIMESTAMP";
	data: {
		timestamp: number;
		abort?: boolean;
	};
};
export declare type InvalidateEvent = {
	type: "INVALIDATE";
};
export declare type EnableEvent = {
	type: "ENABLE";
	data?: {
		abort?: boolean;
		refresh?: boolean;
	};
};
export declare type DisableEvent = {
	type: "DISABLE";
	data?: {
		abort?: boolean;
	};
};
export declare type LoadEvent = {
	type: "LOAD";
	data?: {
		abort?: boolean;
		refresh?: boolean;
	};
};
export declare type AbortEvent = {
	type: "ABORT";
	data?: {
		reason?: any;
	};
};
export declare type ResetEvent = {
	type: "RESET";
	data?: {
		clear?: boolean;
	};
};
export declare type ServiceEvents = {
	currentFetch: CurrentFetchServiceEvent;
};
export declare type CurrentFetchServiceEvent = DoneInvokeEvent<{
	data: any;
}>;
export declare const createCache: () => Cache;
export declare class Cache {
	private _entries;
	private _subscriptions;
	has(key: Key): boolean;
	set(key: Key, fetcher: Interpreter, options?: CacheOptions): void;
	get(key: Key): ReadonlyEntry;
	remove(key: Key): void;
	setCacheTime(key: Key, cacheTime: number): void;
	getCacheTime(key: Key): number;
	setKeepActive(key: Key, keepActive: boolean): void;
	getKeepActive(key: Key): boolean;
	activate(key: Key): void;
	deactivate(key: Key): void;
	filter(key: Key, options?: FilterOptions): ReadonlyEntry[];
	batch(key: Key, batchFn: BatchFn, options?: FilterOptions): void;
	subscribe(subscriptions: Subscription[]): UnsubscribeFn;
	private _findIndex;
	private _matchKeys;
	private _setCacheTime;
	private _filterSubscribeFns;
	private _notifySubscribeFns;
	private _remove;
}
export declare type Entry = {
	key: Key;
	fetcher: Interpreter;
	cacheTime: number;
	cacheTimeout?: Timeout;
	activatorsCount: number;
	keepActive: boolean;
	subscribeFns: SubscribeFn[];
	unsubscribeFn: UnsubscribeFn;
};
export declare type ReadonlyEntry = Readonly<Omit<Entry, "cacheTimeout" | "unsubscribeFn">>;
export declare type CacheOptions = Partial<Pick<Entry, "cacheTime" | "keepActive">>;
export declare type Key = undefined | null | boolean | number | bigint | string | symbol | Key[] | {
	[key: number | string | symbol]: Key;
};
export declare type Timeout = ReturnType<typeof setTimeout>;
export declare type FilterOptions = {
	isExact?: boolean;
	predicateFn?: FilterPredicateFn;
};
export declare type FilterPredicateFn = (entry: ReadonlyEntry) => boolean;
export declare type BatchFn = (entry: ReadonlyEntry) => void;
export declare type Subscription = {
	key?: Key;
	keys?: Key[];
	isExact?: boolean;
	predicateFn?: FilterPredicateFn;
	subscribeFn: SubscribeFn;
};
export declare type SubscribeFn = (parameters: SubscribeFnParameters) => void;
export declare type SubscribeFnParameters = {
	state: State;
	entry: ReadonlyEntry;
};
export declare type UnsubscribeFn = () => void;
export declare const createProxy: (machineOrInterpreter: AnyStateMachine | AnyInterpreter, options?: ProxyOptions) => Proxy;
export declare type Proxy = InvokeCallback & {
	interpreter?: AnyInterpreter;
};
export declare type ProxyOptions = {
	mapFn?: MapFn;
	cleanFn?: CleanFn;
	autoStart?: boolean;
	autoStop?: boolean;
};
export declare type MapFn = (parameters: MapFnParameters) => AnyEventObject | void;
export declare type MapFnParameters = {
	state: AnyState;
	event: AnyEventObject;
};
export declare type CleanFn = () => void;
export declare const useFetcher: (options?: Options) => Proxy;
export declare type Options = FetcherOptions & CacheOptions & Pick<ProxyOptions, "mapFn" | "cleanFn"> & {
	key?: Key;
	cache?: Cache;
	synchronizations?: Synchronization[];
};
export declare type Synchronization = Omit<Subscription, "subscribeFn"> & {
	synchronizeFn: SynchronizeFn;
};
export declare type SynchronizeFn = (parameters: SynchronizeFnParameters) => Event | void;
export declare type SynchronizeFnParameters = SubscribeFnParameters & {
	fetcher: Interpreter;
	cache: Cache;
};
export declare const getLastEvent: <TEvents>(state: AnyState) => TEvents;

export as namespace xstateFetcher;

export {};
