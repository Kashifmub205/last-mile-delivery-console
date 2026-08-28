import { createMMKV, type MMKV } from 'react-native-mmkv';

let storage: MMKV | null = null;

export function getStorage(): MMKV {
  if (!storage) {
    storage = createMMKV({ id: 'delivery-console' });
  }

  return storage;
}
