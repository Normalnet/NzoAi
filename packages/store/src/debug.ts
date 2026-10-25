let isDebugEnabled = false;

export function configureDebug(enabled: boolean) {
  isDebugEnabled = enabled;
}

export function debug(...args: any[]) {
  if (isDebugEnabled) {
    console.log("[@nzoai/store]", ...args);
  }
}
