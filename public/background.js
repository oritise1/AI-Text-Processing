
console.log('Background script loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Text Processing Extension installed');
});