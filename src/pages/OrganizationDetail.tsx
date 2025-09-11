import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Users, Target, Verified, ArrowLeft, Heart, Loader2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { organizationService, OrganizationWithCampaigns } from "@/lib/organizationService";
import organizationImage from "@/assets/organization-relief.jpg";
import { formatCurrency } from "@/lib/utils";

const OrganizationDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [org, setOrg] = useState<OrganizationWithCampaigns | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrganization = async () => {
      if (!slug) {
        setError("Organization slug is required");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await organizationService.getOrganizationBySlug(slug);
        
        if (fetchError) {
          setError(fetchError);
        } else if (!data) {
          setError("Organization not found");
        } else {
          setOrg(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load organization");
      } finally {
        setLoading(false);
      }
    };

    loadOrganization();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading organization...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-semibold mb-2">Organization Not Found</h1>
            <p className="text-muted-foreground mb-4">
              {error || "The organization you are looking for does not exist."}
            </p>
            <Link to="/organizations">
              <Button variant="default">Browse Organizations</Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const campaigns = org.campaigns || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="bg-muted/30 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2">
              <div className="relative rounded-xl overflow-hidden">
                <img 
                  src={org.banner_url || org.logo_url || organizationImage} 
                  alt={org.name} 
                  className="w-full h-64 object-cover" 
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  {org.verification_status === 'verified' && (
                    <Badge variant="default" className="bg-success text-success-foreground">
                      <Verified className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-white/90 text-foreground">
                    {org.category}
                  </Badge>
                </div>
              </div>

              <h1 className="text-3xl font-bold mt-6 text-foreground">{org.name}</h1>
              <div className="flex items-center text-muted-foreground mt-2">
                <MapPin className="w-4 h-4 mr-1" /> 
                {[org.city, org.state, org.country].filter(Boolean).join(', ') || 'Location not specified'}
              </div>

              <p className="mt-4 text-muted-foreground">{org.description}</p>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <Card className="p-4 text-center">
                  <div className="text-xs text-muted-foreground">Beneficiaries Served</div>
                  <div className="text-xl font-semibold">{org.beneficiaries_served || 0}</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-xs text-muted-foreground">Active Campaigns</div>
                  <div className="text-xl font-semibold">{org.active_campaigns_count || campaigns.length}</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-xs text-muted-foreground">Total Raised</div>
                  <div className="text-xl font-semibold text-success">
                    {org.total_raised ? formatCurrency(org.total_raised) : formatCurrency(0)}
                  </div>
                </Card>
              </div>

              {org.mission_statement && (
                <div className="bg-impact-light rounded-lg p-4 mt-6">
                  <div className="text-xs text-impact-dark font-medium">Mission Statement</div>
                  <div className="text-sm font-semibold text-impact">{org.mission_statement}</div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-2">Founded</div>
                <div className="text-lg font-semibold">{org.founded_year || 'Not specified'}</div>
                <Link to={`/organizations/${org.slug}/donate`}>
                  <Button variant="donate" className="w-full mt-6">
                    <Heart className="w-4 h-4 mr-2" /> Donate to Organization
                  </Button>
                </Link>
              </Card>

              {org.website && (
                <Card className="p-6">
                  <div className="text-sm text-muted-foreground mb-2">Website</div>
                  <a 
                    href={org.website.startsWith('http') ? org.website : `https://${org.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-primary hover:underline break-all"
                  >
                    {org.website}
                  </a>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6">Active Campaigns by {org.name}</h2>

          {campaigns.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No active campaigns.</Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {campaigns.map((c) => (
                <Card
                  key={c.id}
                  className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  onClick={() => navigate(`/campaigns/${c.id}`)}
                >
                  <div className="relative">
                    <img 
                      src={c.images?.[0] || organizationImage} 
                      alt={c.title} 
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="outline" className="bg-white/90">{c.category}</Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">{c.title}</h3>
                    <div className="text-xs text-muted-foreground mb-2 flex items-center">
                      <Target className="w-3 h-3 mr-1" /> 
                      Goal: {formatCurrency(c.goal_amount || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OrganizationDetail;
