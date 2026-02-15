import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement scrollIntoView; our components call it for chat autoscroll.
if (!HTMLElement.prototype.scrollIntoView) {
  // eslint-disable-next-line no-extend-native
  HTMLElement.prototype.scrollIntoView = () => {};
}
