import { useEffect } from 'react';

const SCROLL_KEY = 'eva-script-japanese-scroll';

export const useScrollPosition = (loading: boolean, dataLength: number) => {
  // Restore scroll position when data loads
  useEffect(() => {
    if (!loading && dataLength > 0) {
      const savedScroll = localStorage.getItem(SCROLL_KEY);
      if (savedScroll) {
        const scrollY = parseInt(savedScroll, 10);
        window.scrollTo({ top: scrollY, behavior: 'auto' });
      }
    }
  }, [loading, dataLength]);

  // Save scroll position on scroll
  useEffect(() => {
    const handleScroll = () => {
      localStorage.setItem(SCROLL_KEY, window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const resetScrollPosition = () => {
    localStorage.setItem(SCROLL_KEY, '0');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { resetScrollPosition };
};
