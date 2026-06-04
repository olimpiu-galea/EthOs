"use client";

import * as React from "react";
import type { ToastProps } from "@radix-ui/react-toast";

const TOAST_LIMIT = 3;
export const TOAST_DURATION_MS = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  /** Auto-dismiss after this many ms (default 5s) */
  duration?: number;
  /** Navigate here when the toast is clicked */
  href?: string;
};

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST":
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId || action.toastId === undefined
            ? { ...t, open: false }
            : t,
        ),
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: action.toastId
          ? state.toasts.filter((t) => t.id !== action.toastId)
          : [],
      };
    default:
      return state;
  }
}

export function toast({
  duration = TOAST_DURATION_MS,
  ...props
}: Omit<ToasterToast, "id">) {
  const id = genId();
  dispatch({
    type: "ADD_TOAST",
    toast: { ...props, id, open: true, duration },
  });

  const timeout = setTimeout(() => {
    dispatch({ type: "DISMISS_TOAST", toastId: id });
  }, duration);

  toastTimeouts.set(id, timeout);

  return { id, dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }) };
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}
