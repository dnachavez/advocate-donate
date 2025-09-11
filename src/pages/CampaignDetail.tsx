import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MapPin, Users, Target, Clock, ArrowLeft, Heart, Loader2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { campaignService, type CampaignWithOrganization } from "@/lib/campaignService";
import campaignImage from "@/assets/food-donations.jpg";

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignWithOrganization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await campaignService.getCampaignBySlug(id);
      
      if (fetchError) {
        setError(fetchError);
        setCampaign(null);
      } else {
        setCampaign(data);
      }
      
      setLoading(false);
    };

    fetchCampaign();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Card className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Loading Campaign...</h1>
            <p className="text-muted-foreground">Please wait while we fetch the campaign details.</p>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-semibold mb-2">Campaign Not Found</h1>
            <p className="text-muted-foreground mb-4">
              {error || "The campaign you are looking for does not exist."}
            </p>
            <Link to="/campaigns">
              <Button variant="default">Browse Campaigns</Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const progress = (campaign.raised_amount / campaign.goal_amount) * 100;
  const daysLeft = campaign.end_date ? Math.max(0, Math.ceil((new Date(campaign.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null;
  const campaignImageUrl = campaign.featured_image_url || campaignImage;

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
                <img src={campaignImageUrl} alt={campaign.title} className="w-full h-64 object-cover" />
                <div className="absolute top-4 left-4 flex gap-2">
                  {campaign.is_urgent && <Badge variant="destructive">Urgent</Badge>}
                  <Badge variant="outline" className="bg-white/90 text-foreground">
                    {campaign.category}
                  </Badge>
                </div>
                {daysLeft !== null && daysLeft <= 15 && (
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    <Clock className="w-3 h-3 inline mr-1" /> {daysLeft} days left
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-bold mt-6 text-foreground">{campaign.title}</h1>
              <div className="flex items-center text-muted-foreground mt-2">
                <span className="font-medium">{campaign.organization?.name}</span>
                <span className="mx-2">•</span>
                <MapPin className="w-4 h-4 mr-1" /> {campaign.organization?.city}, {campaign.organization?.country}
              </div>

              <p className="mt-4 text-muted-foreground">{campaign.description}</p>

              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">₱{campaign.raised_amount.toLocaleString()} raised</span>
                  <span className="text-muted-foreground">₱{campaign.goal_amount.toLocaleString()} goal</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" /> {campaign.supporters_count || 0} supporters
                  </div>
                  <div className="flex items-center">
                    <Target className="w-4 h-4 mr-1" /> {Math.round(progress)}% funded
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="p-6">
                <Link to={`/campaigns/${campaign.slug}/donate`}>
                  <Button variant="donate" className="w-full">
                    <Heart className="w-4 h-4 mr-2" /> Donate to this Campaign
                  </Button>
                </Link>
                {campaign.organization?.slug && (
                  <Link to={`/organizations/${campaign.organization.slug}`} className="block mt-4">
                    <Button variant="outline" className="w-full">View Organization</Button>
                  </Link>
                )}
              </Card>

              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-2">Time Remaining</div>
                <div className="text-lg font-semibold">
                  {daysLeft !== null ? `${daysLeft} days` : 'Ongoing'}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CampaignDetail;
