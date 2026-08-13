// entrypoints/canvas.content.ts
export default defineContentScript({
  matches: ['*://*.instructure.com/*'],
  main() {
    console.log('Canvas content script loaded.');
  },
});
