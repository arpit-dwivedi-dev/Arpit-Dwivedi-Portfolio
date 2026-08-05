// Minimal type declarations to satisfy TypeScript compilation without adding @types/react
declare module 'react' {
  export const createElement: any;
  export const Fragment: any;
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useRef<T>(initialValue: T): { current: T };
  export function useRef<T>(initialValue: null): { current: T | null };
  export function useRef<T = undefined>(): { current: T | undefined };
  export function useMemo<T>(factory: () => T, deps: readonly any[]): T;
  export type FormEvent = any;
  export type KeyboardEvent = any;
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type ReactNode = any;
  // Provide a minimal React namespace for JSX and FC usage
  export interface FunctionComponent<P = {}> {
    (props: P & { children?: any }): any;
    propTypes?: any;
    defaultProps?: Partial<P>;
  }
  export const FC: FunctionComponent;
  export type ComponentType<P = {}> = FunctionComponent<P>;
  export const StrictMode: any;
  export interface Context<T> {
    Provider: FunctionComponent<{ value: T; children?: any }>;
    Consumer: FunctionComponent<{ children: (value: T) => any }>;
    displayName?: string;
  }
  export function createContext<T>(defaultValue: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;
  export function lazy<T extends FunctionComponent<any>>(load: () => Promise<{ default: T }>): T;
  export const Suspense: FunctionComponent<{ fallback?: any; children?: any }>;
  export interface ErrorInfo {
    componentStack?: string | null;
  }
  export class Component<P = {}, S = {}> {
    constructor(props: P);
    props: Readonly<P> & { children?: any };
    state: Readonly<S>;
    setState(state: Partial<S> | ((prevState: Readonly<S>, props: Readonly<P>) => Partial<S>)): void;
    render(): any;
  }
  const React: any;
  export default React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

// Provide a minimal JSX namespace so TS accepts JSX syntax
declare namespace JSX {
  interface IntrinsicElements {
    [elem: string]: any;
  }
}
