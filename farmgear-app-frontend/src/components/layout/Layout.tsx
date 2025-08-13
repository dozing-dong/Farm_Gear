// React import removed - using new JSX Transform
import { RouteErrorBoundary } from '../errors/RouteErrorBoundary';
import Footer from './Footer';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-0">
        <RouteErrorBoundary>{children}</RouteErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
