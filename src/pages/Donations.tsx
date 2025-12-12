import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Heart, 
  Target, 
  RefreshCw, 
  ArrowLeft,
  Building2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import UnifiedDonationHistory from '@/components/UnifiedDonationHistory';
import { useAuth } from '@/contexts/AuthContext';

const Donations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)} 
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Donations</h1>
                <p className="text-gray-600">Track your giving history and impact</p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          <UnifiedDonationHistory
            userId={user?.id}
            donorEmail={user?.email}
            showFilters={true}
            pageSize={10}
            className="mt-4"
          />

          {/* Quick Actions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Continue your giving journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/donate">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <Heart className="w-5 h-5" />
                    <span className="font-medium">Make a Donation</span>
                    <span className="text-xs text-gray-500">Support a cause today</span>
                  </Button>
                </Link>
                
                <Link to="/campaigns">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <Target className="w-5 h-5" />
                    <span className="font-medium">Browse Campaigns</span>
                    <span className="text-xs text-gray-500">Find new causes to support</span>
                  </Button>
                </Link>
                
                <Link to="/organizations">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <Building2 className="w-5 h-5" />
                    <span className="font-medium">Explore Organizations</span>
                    <span className="text-xs text-gray-500">Discover verified nonprofits</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Donations;
