"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export const useMounted = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
