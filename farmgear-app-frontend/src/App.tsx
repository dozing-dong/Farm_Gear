import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ui/toast';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserProfilePage from './pages/UserProfilePage';
import DashboardPage from './pages/DashboardPage';
import EquipmentListPage from './pages/EquipmentListPage';
import EquipmentDetailPage from './pages/EquipmentDetailPage';
import EquipmentCreatePage from './pages/EquipmentCreatePage';
import MyEquipmentPage from './pages/MyEquipmentPage';
import MyEquipmentDetailPage from './pages/MyEquipmentDetailPage';
import PaymentPage from './pages/PaymentPage';
import HowToListPage from './pages/HowToListPage';
import PricingGuidePage from './pages/PricingGuidePage';
import SafetyTipsPage from './pages/SafetyTipsPage';
import MaintenanceGuidePage from './pages/MaintenanceGuidePage';
import BestPracticesPage from './pages/BestPracticesPage';
import FAQPage from './pages/FAQPage';
import ContactPage from './pages/ContactPage';
import SupportPage from './pages/SupportPage';
import EquipmentPhotosPage from './pages/EquipmentPhotosPage';
import SuccessStoriesPage from './pages/SuccessStoriesPage';
import AboutPage from './pages/AboutPage';
import { RouteErrorBoundary } from './components/errors/RouteErrorBoundary';

function App() {
  return (
    <ToastProvider>
      <Router>
        <ScrollToTop />
        <RouteErrorBoundary>
          <Routes>
          {/* Auth pages without layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Pages with layout */}
          <Route
            path="/"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/profile"
            element={
              <Layout>
                <UserProfilePage />
              </Layout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Layout>
                <DashboardPage />
              </Layout>
            }
          />
          <Route
            path="/equipment"
            element={
              <Layout>
                <EquipmentListPage />
              </Layout>
            }
          />
          <Route
            path="/equipment/create"
            element={
              <Layout>
                <EquipmentCreatePage />
              </Layout>
            }
          />
          <Route
            path="/equipment/my"
            element={
              <Layout>
                <MyEquipmentPage />
              </Layout>
            }
          />
          <Route
            path="/equipment/my/:id"
            element={
              <Layout>
                <MyEquipmentDetailPage />
              </Layout>
            }
          />
          <Route
            path="/equipment/:id"
            element={
              <Layout>
                <EquipmentDetailPage />
              </Layout>
            }
          />
          <Route
            path="/payment/:orderId"
            element={
              <Layout>
                <PaymentPage />
              </Layout>
            }
          />
          <Route
            path="/how-to-list"
            element={
              <Layout>
                <HowToListPage />
              </Layout>
            }
          />
          <Route
            path="/pricing-guide"
            element={
              <Layout>
                <PricingGuidePage />
              </Layout>
            }
          />
          <Route
            path="/safety-tips"
            element={
              <Layout>
                <SafetyTipsPage />
              </Layout>
            }
          />
          <Route
            path="/maintenance-guide"
            element={
              <Layout>
                <MaintenanceGuidePage />
              </Layout>
            }
          />
          <Route
            path="/best-practices"
            element={
              <Layout>
                <BestPracticesPage />
              </Layout>
            }
          />
          <Route
            path="/faq"
            element={
              <Layout>
                <FAQPage />
              </Layout>
            }
          />
          <Route
            path="/contact"
            element={
              <Layout>
                <ContactPage />
              </Layout>
            }
          />
          <Route
            path="/equipment-photos"
            element={
              <Layout>
                <EquipmentPhotosPage />
              </Layout>
            }
          />
          <Route
            path="/success-stories"
            element={
              <Layout>
                <SuccessStoriesPage />
              </Layout>
            }
          />
          <Route
            path="/about"
            element={
              <Layout>
                <AboutPage />
              </Layout>
            }
          />
          <Route
            path="/support"
            element={
              <Layout>
                <SupportPage />
              </Layout>
            }
          />
          </Routes>
        </RouteErrorBoundary>
      </Router>
    </ToastProvider>
  );
}

export default App;
