import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { PUSH_INSTALLATION_STORAGE_KEY } from '../constants/pushConstants';
import { createInstallationIdStore } from '../utils/pushClientPolicy.cjs';

const createStore = (storage) => createInstallationIdStore({
    storage,
    crypto: Crypto,
    key: PUSH_INSTALLATION_STORAGE_KEY,
});

const defaultStore = createStore(AsyncStorage);

export const getOrCreatePushInstallationId = ({ storage = AsyncStorage } = {}) => (
    storage === AsyncStorage ? defaultStore.getOrCreate() : createStore(storage).getOrCreate()
);

export const getStoredPushInstallationId = ({ storage = AsyncStorage } = {}) => (
    storage === AsyncStorage ? defaultStore.getStored() : createStore(storage).getStored()
);

export default getOrCreatePushInstallationId;
