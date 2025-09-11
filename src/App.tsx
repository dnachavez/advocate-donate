import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth, RequireVerification, PublicRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Organizations from "./pages/Organizations";
import Campaigns from "./pages/Campaigns";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Donate from "./pages/Donate";
import HowItWorks from "./pages/HowItWorks";
import Stories from "./pages/Stories";
import TaxInfo from "./pages/TaxInfo";
import Verify from "./pages/Verify";
import CreateCampaign from "./pages/CreateCampaign";
import Resources from "./pages/Resources";
import Support from "./pages/Support";
import Safety from "./pages/Safety";
import Guidelines from "./pages/Guidelines";
import NotFound from "./pages/NotFound";
import OrganizationDetail from "./pages/OrganizationDetail";
import CampaignDetail from "./pages/CampaignDetail";
import Careers from "./pages/Careers";
import Press from "./pages/Press";
import Contact from "./pages/Contact";
import Api from "./pages/Api";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import StoryDetail from "./pages/StoryDetail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EmailVerification from "./pages/EmailVerification";
import DonateOrganization from "./pages/DonateOrganization";
import DonateCampaign from "./pages/DonateCampaign";
import DonationSuccess from "./pages/DonationSuccess";
import Dashboard from "./pages/Dashboard";
import Donations from "./pages/Donations";
import OrganizationSetup from "./pages/OrganizationSetup";
import EditProfile from "./pages/EditProfile";
import PrivacySettings from "./pages/PrivacySettings";
import PaymentMethods from "./pages/PaymentMethods";
import NotificationSettings from "./pages/NotificationSettings";
import ViewDonors from "./pages/ViewDonors";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/organizations/:slug" element={<OrganizationDetail />} />
          <Route path="/organizations/:slug/donate" element={
            <RequireAuth>
              <DonateOrganization />
            </RequireAuth>
          } />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/campaigns/:id/donate" element={
            <RequireAuth>
              <DonateCampaign />
            </RequireAuth>
          } />
          <Route path="/about" element={<About />} />
          <Route path="/auth" element={
             <PublicRoute>
               <Auth />
             </PublicRoute>
           } />
           <Route path="/dashboard" element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            } />
            <Route path="/organization-setup" element={
              <RequireAuth>
                <OrganizationSetup />
              </RequireAuth>
            } />
            <Route path="/donations" element={
              <RequireAuth>
                <Donations />
              </RequireAuth>
            } />
            <Route path="/edit-profile" element={
              <RequireAuth>
                <EditProfile />
              </RequireAuth>
            } />
            <Route path="/privacy-settings" element={
              <RequireAuth>
                <PrivacySettings />
              </RequireAuth>
            } />
            <Route path="/payment-methods" element={
              <RequireAuth>
                <PaymentMethods />
              </RequireAuth>
            } />
            <Route path="/notification-settings" element={
              <RequireAuth>
                <NotificationSettings />
              </RequireAuth>
            } />
            <Route path="/view-donors" element={
              <RequireAuth>
                <ViewDonors />
              </RequireAuth>
            } />
          <Route path="/donate" element={
            <RequireAuth>
              <Donate />
            </RequireAuth>
          } />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/stories/:slug" element={<StoryDetail />} />
          <Route path="/tax-info" element={<TaxInfo />} />
          <Route path="/verify" element={
            <RequireAuth>
              <RequireVerification>
                <Verify />
              </RequireVerification>
            </RequireAuth>
          } />
          <Route path="/create-campaign" element={
            <RequireAuth>
              <RequireVerification>
                <CreateCampaign />
              </RequireVerification>
            </RequireAuth>
          } />
          <Route path="/resources" element={<Resources />} />
          <Route path="/support" element={<Support />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/guidelines" element={<Guidelines />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/press" element={<Press />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/api" element={<Api />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/donation/success/:donationId" element={<DonationSuccess />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;



