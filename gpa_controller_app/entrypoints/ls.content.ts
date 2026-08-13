// entrypoints/ls.content.ts
export default defineContentScript({
  matches: ['*://learningsuite.byu.edu/*'],
  main() {
    console.log('Learning Suite content script loaded.');
  },
});
