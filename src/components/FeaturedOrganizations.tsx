import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Target, Verified } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { organizationService, type Organization } from "@/lib/organizationService";
import { useToast } from "@/hooks/use-toast";
import organizationImage from "@/assets/organization-relief.jpg";

const FeaturedOrganizations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationStats, setOrganizationStats] = useState<Record<string, {
    totalRaised: number;
    donationCount: number;
    campaignCount: number;
  }>>({});

  useEffect(() => {
    const fetchFeaturedOrganizations = async () => {
      try {
        setLoading(true);
        const { data, error } = await organizationService.getOrganizations(3, 0);

        if (error) {
          toast({
            title: "Error",
            description: "Failed to load organizations: " + error,
            variant: "destructive",
          });
          return;
        }

        setOrganizations(data);

        // Fetch stats for each organization
        const statsPromises = data.map(org =>
          organizationService.getOrganizationDonationStats(org.id)
        );

        const statsResults = await Promise.all(statsPromises);
        const statsMap: Record<string, {
          totalRaised: number;
          donationCount: number;
          campaignCount: number;
        }> = {};

        data.forEach((org, index) => {
          const stats = statsResults[index];
          if (!stats.error) {
            statsMap[org.id] = {
              totalRaised: stats.totalRaised,
              donationCount: stats.donationCount,
              campaignCount: stats.campaignCount
            };
          }
        });

        setOrganizationStats(statsMap);
      } catch (error) {
        console.error('Error fetching featured organizations:', error);
        toast({
          title: "Error",
          description: "Failed to load organizations",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedOrganizations();
  }, [toast]);

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Featured Organizations
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Trusted Partners Making a Difference
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Meet the verified organizations creating real impact in communities across the Philippines.
            Every donation goes directly to their approved programs.
          </p>
        </div>

        {/* Organizations Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="h-48 bg-muted"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              </Card>
            ))
          ) : organizations.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No organizations found.</p>
            </div>
          ) : (
            organizations.map((org) => (
              <Card
                key={org.id}
                className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card cursor-pointer"
                onClick={() => navigate(`/organizations/${org.slug}`)}
              >
                {/* Organization Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={org.banner_url || org.logo_url || organizationImage}
                    alt={org.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge variant={org.verification_status === 'verified' ? "default" : "secondary"} className="bg-success text-success-foreground">
                      <Verified className="w-3 h-3 mr-1" />
                      {org.verification_status === 'verified' ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="outline" className="bg-white/90 text-foreground">
                      {org.category}
                    </Badge>
                  </div>
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
                    {org.city ? `${org.city}, ${org.state || org.country}` : org.country || 'Location not specified'}
                  </div>

                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {org.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {organizationStats[org.id]?.donationCount || 0} donors
                    </div>
                    <div className="flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      {organizationStats[org.id]?.campaignCount || 0} campaigns
                    </div>
                  </div>

                  {/* Total Raised */}
                  <div className="bg-success-light rounded-lg p-3 mb-4">
                    <div className="text-xs text-success-dark font-medium mb-1">Total Raised</div>
                    <div className="text-sm font-semibold text-success">
                      ₱{(organizationStats[org.id]?.totalRaised || 0).toLocaleString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/organizations/${org.slug}`);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link to="/organizations">
            <Button variant="outline" size="lg">
              View All Organizations
              <Users className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedOrganizations;