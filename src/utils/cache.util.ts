export const cache = {
  getValue: (key: string) => {
    return localStorage.getItem(key);
  },

  setValue: (key: string, value: string) => {
    return localStorage.setItem(key, value);
  },

  has: (key: string) => {
    return !!localStorage.getItem(key);
  },

  clearValue: (key: string) => {
    return localStorage.removeItem(key);
  },
};
