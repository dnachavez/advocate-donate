import React, { useState, useEffect } from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Target, 
  Verified,
  Grid3X3,
  List,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { organizationService, Organization } from "@/lib/organizationService";
import organizationImage from "@/assets/organization-relief.jpg";

const Organizations = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const formatCurrency = (amount: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const loadOrganizations = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const offset = reset ? 0 : organizations.length;
      const { data, error: fetchError, totalCount: count } = await organizationService.getOrganizations(20, offset);

      if (fetchError) {
        setError(fetchError);
        return;
      }

      if (reset) {
        setOrganizations(data);
      } else {
        setOrganizations(prev => [...prev, ...data]);
      }
      
      setTotalCount(count);
    } catch (err) {
      console.error('Error loading organizations:', err);
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadOrganizations(true);
  }, []);

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = !searchTerm || 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All Categories' || org.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleLoadMore = () => {
    if (organizations.length < totalCount) {
      loadOrganizations(false);
    }
  };

  const categories = [
    "All Categories",
    "Education",
    "Healthcare", 
    "Environment",
    "Social Services",
    "Arts & Culture",
    "Animal Welfare",
    "Community Development",
    "Disaster Relief",
    "Human Rights",
    "Youth Development",
    "Senior Services",
    "Religious",
    "Other"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Verified Organizations
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Discover trusted organizations creating real impact in communities 
            across the Philippines. Every organization is verified and transparent.
          </p>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-12 bg-muted/30 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search organizations..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={category === selectedCategory ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Organizations Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {loading ? 'Loading...' : `${filteredOrganizations.length} Organizations Found`}
              </h2>
              <p className="text-muted-foreground">
                All organizations are verified and actively making impact
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}. <button 
                  onClick={() => loadOrganizations(true)} 
                  className="underline hover:no-underline"
                >
                  Try again
                </button>
              </AlertDescription>
            </Alert>
          )}

          {/* Organizations Grid */}
          {!loading && !error && (
            <>
              {filteredOrganizations.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredOrganizations.map((org) => (
                    <Card
                      key={org.id}
                      className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card cursor-pointer"
                      onClick={() => navigate(`/organizations/${org.slug}`)}
                    >
                      {/* Organization Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={org.logo_url || org.banner_url || organizationImage}
                          alt={org.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge variant="default" className="bg-success text-success-foreground">
                            <Verified className="w-3 h-3 mr-1" />
                            {org.verification_status === 'verified' ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="absolute top-4 right-4">
                          <Badge variant="outline" className="bg-white/90 text-foreground">
                            {org.category}
                          </Badge>
                        </div>
                        {org.founded_year && (
                          <div className="absolute bottom-4 left-4">
                            <div className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                              Founded {org.founded_year}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Organization Content */}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                            {org.name}
                          </h3>
                        </div>
                        
                        <div className="flex items-center text-muted-foreground text-sm mb-3">
                          <MapPin className="w-4 h-4 mr-1" />
                          {org.city}, {org.state}
                        </div>

                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {org.description}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {org.beneficiaries_served || 0} served
                          </div>
                          <div className="flex items-center">
                            <Target className="w-4 h-4 mr-1" />
                            {org.active_campaigns_count || 0} active
                          </div>
                          <div className="font-semibold text-success">
                            {formatCurrency(org.total_raised)}
                          </div>
                        </div>

                        {/* Mission Statement */}
                        {org.mission_statement && (
                          <div className="bg-muted/30 rounded-lg p-3 mb-4">
                            <div className="text-xs text-muted-foreground font-medium mb-1">Mission</div>
                            <div className="text-sm font-medium line-clamp-2">{org.mission_statement}</div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/organizations/${org.slug}`);
                            }}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/organizations/${org.slug}/donate`);
                            }}
                          >
                            Donate Now
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Users className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Organizations Found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || selectedCategory !== 'All Categories'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No verified organizations are available at the moment.'}
                  </p>
                  {(searchTerm || selectedCategory !== 'All Categories') && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('All Categories');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Load More */}
          {!loading && !error && organizations.length < totalCount && (
            <div className="text-center mt-12">
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Organizations'
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Showing {organizations.length} of {totalCount} organizations
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Organizations;