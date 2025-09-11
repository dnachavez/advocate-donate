import React, { useState, useEffect } from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Target, 
  Clock,
  Heart,
  TrendingUp,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { campaignService, CampaignWithOrganization } from "@/lib/campaignService";
import campaignImage from "@/assets/food-donations.jpg";

const Campaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignWithOrganization[]>([]);
  const [featuredCampaigns, setFeaturedCampaigns] = useState<CampaignWithOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('Most Recent');
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Add error boundary protection
  const [hasError, setHasError] = useState(false);

  const formatCurrency = (amount: number | null | undefined, currency: string = 'PHP') => {
    if (amount === null || amount === undefined) return '₱0';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateDaysLeft = (endDate: string | null): number | null => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const loadCampaigns = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const offset = reset ? 0 : campaigns.length;
      const { data, error: fetchError, totalCount: count } = await campaignService.getCampaigns(20, offset, selectedCategory !== 'All Categories' ? selectedCategory : undefined);

      if (fetchError) {
        setError(fetchError);
        return;
      }


      if (reset) {
        setCampaigns(data);
      } else {
        setCampaigns(prev => [...prev, ...data]);
      }
      
      setTotalCount(count);
    } catch (err) {
      console.error('Error loading campaigns:', err);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadFeaturedCampaigns = async () => {
    try {
      const { data, error: fetchError } = await campaignService.getFeaturedCampaigns(4);
      if (fetchError) {
        console.error('Error loading featured campaigns:', fetchError);
        return;
      }
      setFeaturedCampaigns(data);
    } catch (err) {
      console.error('Error loading featured campaigns:', err);
    }
  };

  useEffect(() => {
    try {
      loadCampaigns(true);
      loadFeaturedCampaigns();
    } catch (error) {
      console.error('Error in useEffect:', error);
      setHasError(true);
    }
  }, [selectedCategory]);

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = !searchTerm || 
      campaign.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sortBy) {
      case 'Ending Soon':
        const daysLeftA = calculateDaysLeft(a.end_date) ?? Infinity;
        const daysLeftB = calculateDaysLeft(b.end_date) ?? Infinity;
        return daysLeftA - daysLeftB;
      case 'Most Funded':
        const percentA = (a.raised_amount / a.goal_amount) * 100;
        const percentB = (b.raised_amount / b.goal_amount) * 100;
        return percentB - percentA;
      case 'Most Supporters':
        return b.supporters_count - a.supporters_count;
      case 'Most Recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const handleLoadMore = () => {
    if (campaigns.length < totalCount) {
      loadCampaigns(false);
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

  const sortOptions = [
    "Most Recent",
    "Ending Soon", 
    "Most Funded",
    "Most Supporters"
  ];

  // Error boundary fallback
  if (hasError) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-8">
              We're having trouble loading the campaigns page. Please try refreshing.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  try {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
      
      {/* Header Section */}
      <section className="py-20 bg-gradient-impact text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Active Campaigns
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Support specific causes and track real-time progress. Every contribution 
            brings these important projects one step closer to completion.
          </p>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-8 bg-muted/30 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search campaigns..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 4).map((category) => (
                <Button
                  key={category}
                  variant={category === selectedCategory ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-auto">
                  <Filter className="w-4 h-4 mr-1" />
                  <SelectValue placeholder="More" />
                </SelectTrigger>
                <SelectContent>
                  {categories.slice(4).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Badge variant="outline" className="mb-4">
              <TrendingUp className="w-3 h-3 mr-1" />
              Featured Campaigns
            </Badge>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Urgent & High-Impact Projects
            </h2>
            <p className="text-muted-foreground">
              These campaigns need immediate support to reach their critical goals.
            </p>
          </div>

          {/* Loading State for Featured */}
          {loading && (
            <div className="grid lg:grid-cols-2 gap-8 mb-16">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-64 w-full" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-2 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Featured Campaigns */}
          {!loading && featuredCampaigns.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-8 mb-16">
              {featuredCampaigns.map((campaign) => {
                const daysLeft = calculateDaysLeft(campaign.end_date);
                const progressPercent = campaign.raised_amount && campaign.goal_amount 
                  ? (campaign.raised_amount / campaign.goal_amount) * 100 
                  : 0;
                return (
                  <Card
                    key={campaign.id}
                    className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    onClick={() => navigate(`/campaigns/${campaign.slug}`)}
                  >
                    <div className="relative">
                      <img
                        src={campaign.featured_image_url || campaignImage}
                        alt={campaign.title}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        {campaign.is_urgent && (
                          <Badge variant="destructive" className="animate-pulse">
                            Urgent
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-white/90">
                          {campaign.category}
                        </Badge>
                      </div>
                      {daysLeft !== null && daysLeft <= 15 && (
                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {daysLeft} days left
                        </div>
                      )}
                    </div>

                    <div className="p-8">
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {campaign.title}
                        </h3>
                        <div className="flex items-center text-muted-foreground text-sm mb-4">
                          <MapPin className="w-4 h-4 mr-1" />
                          {campaign.organization?.city && campaign.organization?.state 
                            ? `${campaign.organization.city}, ${campaign.organization.state} · ` 
                            : ''
                          }by {campaign.organization?.name || 'Unknown Organization'}
                        </div>
                        <p className="text-muted-foreground line-clamp-2 mb-4">
                          {campaign.description}
                        </p>
                      </div>

                      {/* Progress */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-2xl font-bold text-foreground">{formatCurrency(campaign.raised_amount)}</span>
                          <span className="text-sm text-muted-foreground">{Math.round(progressPercent || 0)}% funded</span>
                        </div>
                        <Progress value={progressPercent || 0} className="h-2 mb-3" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Goal: {formatCurrency(campaign.goal_amount)}</span>
                          <span>{campaign.supporters_count || 0} supporters</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="lg"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/campaigns/${campaign.slug}`);
                          }}
                        >
                          Learn More
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/campaigns/${campaign.slug}/donate`);
                          }}
                        >
                          <Heart className="w-4 h-4 mr-1" />
                          Donate Now
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* All Campaigns */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {loading ? 'Loading...' : `All Campaigns (${sortedCampaigns.length})`}
            </h2>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-40 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-2 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
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
                  onClick={() => loadCampaigns(true)} 
                  className="underline hover:no-underline"
                >
                  Try again
                </button>
              </AlertDescription>
            </Alert>
          )}

          {/* Campaigns Grid */}
          {!loading && !error && (
            <>
              {sortedCampaigns.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedCampaigns.map((campaign) => {
                    const daysLeft = calculateDaysLeft(campaign.end_date);
                    const progressPercent = campaign.raised_amount && campaign.goal_amount 
                      ? (campaign.raised_amount / campaign.goal_amount) * 100 
                      : 0;
                    
                    return (
                      <Card
                        key={campaign.id}
                        className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                        onClick={() => navigate(`/campaigns/${campaign.slug}`)}
                      >
                        <div className="relative">
                          <img
                            src={campaign.featured_image_url || campaignImage}
                            alt={campaign.title}
                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 left-3 flex gap-2">
                            {campaign.is_urgent && (
                              <Badge variant="destructive">
                                Urgent
                              </Badge>
                            )}
                          </div>
                          {daysLeft !== null && daysLeft <= 15 && (
                            <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
                              {daysLeft}d left
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="mb-3">
                            <h3 className="font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                              {campaign.title}
                            </h3>
                            <div className="text-xs text-muted-foreground">
                              by {campaign.organization?.name || 'Unknown Organization'}
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="mb-3">
                            <Progress value={progressPercent} className="h-1.5 mb-2" />
                            <div className="flex justify-between text-xs">
                              <span className="font-medium">{formatCurrency(campaign.raised_amount)}</span>
                              <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{campaign.supporters_count} supporters</span>
                            <span>{daysLeft ? `${daysLeft} days left` : 'No deadline'}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Target className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Campaigns Found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || selectedCategory !== 'All Categories'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No active campaigns are available at the moment.'}
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
          {!loading && !error && campaigns.length < totalCount && (
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
                  'Load More Campaigns'
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Showing {campaigns.length} of {totalCount} campaigns
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
  } catch (error) {
    console.error('Error rendering Campaigns component:', error);
    setHasError(true);
    return null;
  }
};

export default Campaigns;