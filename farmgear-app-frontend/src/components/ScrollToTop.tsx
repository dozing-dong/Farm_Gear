import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Immediately scroll to top when page route changes, ignore smooth scroll setting
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant', // Force immediate scroll, don't use smooth effect
      });
    } catch {
      // Compatibility for old browsers that don't support behavior: 'instant'
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}

export default ScrollToTop;
