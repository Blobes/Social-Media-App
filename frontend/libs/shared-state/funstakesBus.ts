// Shared Bus for Funstakes
export const funstakesBus = {
  emit(event: string, data: any) {
    if (typeof window !== "undefined") {
      const customEvent = new CustomEvent(`FUNSTAKES_${event}`, {
        detail: data,
      });
      window.dispatchEvent(customEvent);
    }
  },
  on(event: string, callback: (data: any) => void) {
    if (typeof window !== "undefined") {
      const handler = (e: any) => callback(e.detail);
      window.addEventListener(`FUNSTAKES_${event}`, handler);
      return () => window.removeEventListener(`FUNSTAKES_${event}`, handler);
    }
  },
};
