"use client";

export const sharedRegistry = {
  components: {} as Record<string, React.ComponentType<any>>,
  hooks: {} as Record<string, (...args: any[]) => any>,
  // Internal sets to track unique references
  _rawComponents: new Set<React.ComponentType<any>>(),
  _rawHooks: new Set<Function>(),
};

export const registerItem = {
  component: (name: string, comp: React.ComponentType<any>) => {
    // 1. Check if the name is already taken
    if (sharedRegistry.components[name]) {
      console.warn(
        `Registry Warning: Component name "${name}" is already registered.`,
      );
      return;
    }

    // 2. Check if the exact component reference already exists under a different name
    if (sharedRegistry._rawComponents.has(comp)) {
      const existingName = Object.keys(sharedRegistry.components).find(
        (key) => sharedRegistry.components[key] === comp,
      );
      console.warn(
        `Registry Warning: This component is already registered as "${existingName}". Skipping duplicate registration for "${name}".`,
      );
      return;
    }

    // 3. Register if unique
    sharedRegistry.components[name] = comp;
    sharedRegistry._rawComponents.add(comp);
  },

  hook: (name: string, hookFn: (...args: any[]) => any) => {
    // 1. Check name
    if (sharedRegistry.hooks[name]) {
      console.warn(
        `Registry Warning: Hook name "${name}" is already registered.`,
      );
      return;
    }

    // 2. Check reference
    if (sharedRegistry._rawHooks.has(hookFn)) {
      const existingName = Object.keys(sharedRegistry.hooks).find(
        (key) => sharedRegistry.hooks[key] === hookFn,
      );
      console.warn(
        `Registry Warning: This hook is already registered as "${existingName}". Skipping duplicate.`,
      );
      return;
    }

    sharedRegistry.hooks[name] = hookFn;
    sharedRegistry._rawHooks.add(hookFn);
  },
};
