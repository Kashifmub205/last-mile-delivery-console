jest.mock('react-native-mmkv', () => ({
  createMMKV: () => {
    const data = new Map();

    return {
      getString: key => data.get(key),
      set: (key, value) => {
        data.set(key, value);
      },
      remove: key => {
        data.delete(key);
      },
    };
  },
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn(async () => ({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })),
  },
}));
