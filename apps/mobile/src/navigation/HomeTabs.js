import React, { useRef } from 'react';
import MainTabs from './MainTabs';
import DirectoryTabs from './DirectoryTabs';
import { useDietitianConnection } from '../features/dietitianConnection/context/DietitianConnectionContext';
import { resolveAppMode } from '../features/dietitianDirectory/utils/directoryContract.cjs';

// The single place that picks the tab set. Connected clients, and anyone
// whose connection has not been read yet, get the existing MainTabs.
export const useAppMode = () => {
    const { hasLoadedConnection, hasConnectionLoadError, hasActiveDietitian } = useDietitianConnection();
    const previousModeRef = useRef('full');
    const mode = resolveAppMode({ hasLoadedConnection, hasConnectionLoadError, hasActiveDietitian, previousMode: previousModeRef.current });
    previousModeRef.current = mode;
    return mode;
};

const HomeTabs = ({ mode }) => (mode === 'directory' ? <DirectoryTabs /> : <MainTabs />);

export default HomeTabs;
