import { useEffect, useState } from 'react';

// Turns true after the first commit, to skip entrance animations on initial render.
export function useHasMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

export default useHasMounted;
