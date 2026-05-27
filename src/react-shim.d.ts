// Minimal type declarations to satisfy TypeScript compilation without adding @types/react
declare module 'react' {
  export const createElement: any;
  export const Fragment: any;
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useRef<T>(initialValue: T): { current: T };
  export function useRef<T>(initialValue: null): { current: T | null };
  export function useRef<T = undefined>(): { current: T | undefined };
  export type FormEvent = any;
  export type KeyboardEvent = any;
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prevState: S) => S);
  // Provide a minimal React namespace for JSX and FC usage
  export interface FunctionComponent<P = {}> {
    (props: P & { children?: any }): any;
    propTypes?: any;
    defaultProps?: Partial<P>;
  }
  export const FC: FunctionComponent;
  export const StrictMode: any;
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
