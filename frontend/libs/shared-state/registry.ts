// libs/shared-state/src/registry.ts
export const sharedRegistry = {
  components: {} as Record<string, React.ComponentType<any>>,
  hooks: {} as Record<string, (...args: any[]) => any>,
};

export const registerItem = {
  component: (name: string, comp: React.ComponentType<any>) => {
    sharedRegistry.components[name] = comp;
  },
  hook: (name: string, hookFn: (...args: any[]) => any) => {
    sharedRegistry.hooks[name] = hookFn;
  },
};
