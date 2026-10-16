import { useCallback, useEffect, useRef, useState } from 'react';
import { getPublicDietitianAvatarUrls, listPublicDietitians } from '../services/dietitianDirectoryService';
import { DIRECTORY_PAGE_SIZE, GENERIC_ERROR_MESSAGE } from '../utils/directoryContract.cjs';
import { useDietitianDirectory } from '../context/DietitianDirectoryContext';

const SEARCH_DEBOUNCE_MS = 300;

export function useDietitianDirectoryViewModel() {
    const directory = useDietitianDirectory();
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [dietitians, setDietitians] = useState([]);
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const requestRef = useRef(0);

    useEffect(() => {
        const timer = setTimeout(() => setQuery(search.trim()), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [search]);

    const attachAvatars = useCallback(async (items, requestId) => {
        const avatars = await getPublicDietitianAvatarUrls(items.map((item) => item.id));
        if (requestRef.current !== requestId || Object.keys(avatars).length === 0) return;
        setDietitians((current) => current.map((item) => (avatars[item.id] ? { ...item, avatarUrl: avatars[item.id] } : item)));
    }, []);

    const load = useCallback(async ({ reset, refreshing = false } = { reset: true }) => {
        const requestId = reset ? requestRef.current + 1 : requestRef.current;
        if (reset) requestRef.current = requestId;
        const offset = reset ? 0 : dietitians.length;
        if (reset && !refreshing) setStatus('loading');
        if (refreshing) setIsRefreshing(true);
        if (!reset) setIsLoadingMore(true);
        try {
            const page = await listPublicDietitians({ search: query, offset, limit: DIRECTORY_PAGE_SIZE });
            if (requestRef.current !== requestId) return;
            setDietitians((current) => {
                if (reset) return page;
                const known = new Set(current.map((item) => item.id));
                return [...current, ...page.filter((item) => !known.has(item.id))];
            });
            setHasMore(page.length === DIRECTORY_PAGE_SIZE);
            setError(null);
            setStatus('ready');
            void attachAvatars(page, requestId);
        } catch (nextError) {
            if (requestRef.current !== requestId) return;
            setError(nextError?.message || GENERIC_ERROR_MESSAGE);
            if (reset) setStatus('error');
        } finally {
            if (requestRef.current === requestId) {
                setIsLoadingMore(false);
                setIsRefreshing(false);
            }
        }
    }, [attachAvatars, dietitians.length, query]);

    // Reload from the first page whenever the debounced query changes.
    const loadRef = useRef(load);
    loadRef.current = load;
    useEffect(() => {
        void loadRef.current({ reset: true });
    }, [query]);

    const loadMore = useCallback(() => {
        if (!hasMore || isLoadingMore || status !== 'ready') return;
        void load({ reset: false });
    }, [hasMore, isLoadingMore, load, status]);

    const refresh = useCallback(() => {
        void load({ reset: true, refreshing: true });
        void directory.refresh({ silent: true });
    }, [directory, load]);

    return {
        search,
        setSearch,
        isSearching: query.length > 0,
        dietitians,
        status,
        error,
        hasMore,
        isLoadingMore,
        isRefreshing,
        loadMore,
        refresh,
        retry: () => void load({ reset: true }),
        pendingRequest: directory.pendingRequest,
        openInquiryCount: directory.openInquiryCount,
    };
}

export default useDietitianDirectoryViewModel;
