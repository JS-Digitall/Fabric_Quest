/** Editors can cite their own pages; only Learn links are labelled as Learn. */
export const isLearnLink = (url: string) =>
  url.startsWith('https://learn.microsoft.com/');
