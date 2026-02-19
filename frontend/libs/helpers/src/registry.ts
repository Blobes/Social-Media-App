"use client";

import { ISharedComponents, ISharedHooks } from "@funstakes/types";

export const sharedRegistry = {
  components: {} as ISharedComponents,
  hooks: {} as ISharedHooks,
  _rawComponents: new Set<any>(),
  _rawHooks: new Set<Function>(),
};

export const registerItem = {
  // Use <K extends keyof ISharedComponents> to lock the name to your interface keys
  component: <K extends keyof ISharedComponents>(
    name: K,
    comp: ISharedComponents[K],
  ) => {
    const components = sharedRegistry.components as Record<string, any>;

    // 1. Check if name is taken
    if (components[name as string]) {
      console.warn(
        `Registry Warning: Component name "${name as string}" is already registered.`,
      );
      return;
    }

    // 2. Check if exact reference exists
    if (sharedRegistry._rawComponents.has(comp as any)) {
      const existingName = Object.keys(components).find(
        (key) => components[key] === comp,
      );
      console.warn(
        `Registry Warning: Component already registered as "${existingName}". Skipping "${name as string}".`,
      );
      return;
    }

    // 3. Register
    components[name as string] = comp;
    sharedRegistry._rawComponents.add(comp as any);
  },

  hook: <K extends keyof ISharedHooks>(name: K, hookFn: ISharedHooks[K]) => {
    const hooks = sharedRegistry.hooks as Record<string, any>;

    if (hooks[name as string]) {
      console.warn(
        `Registry Warning: Hook name "${name as string}" is already registered.`,
      );
      return;
    }

    if (sharedRegistry._rawHooks.has(hookFn as any)) {
      const existingName = Object.keys(hooks).find(
        (key) => hooks[key] === hookFn,
      );
      console.warn(
        `Registry Warning: Hook already registered as "${existingName}". Skipping "${name as string}".`,
      );
      return;
    }

    hooks[name as string] = hookFn;
    sharedRegistry._rawHooks.add(hookFn as any);
  },
};
