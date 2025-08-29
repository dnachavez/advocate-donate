import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MapPin, Users, Target, Clock, ArrowLeft, Heart } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import campaignImage from "@/assets/food-donations.jpg";

const campaigns = [
  {
    id: 1,
    title: "Emergency Food Distribution for Typhoon Victims",
    organization: "Hope Community Center",
    organizationSlug: "hope-community-center",
    location: "Manila, Philippines",
    description:
      "Providing immediate food relief to 500 families affected by recent typhoon damage in Metro Manila.",
    category: "Emergency Relief",
    goalAmount: 150000,
    raisedAmount: 95000,
    supporters: 234,
    daysLeft: 12,
    image: campaignImage,
    urgent: true,
    featured: true,
  },
  {
    id: 2,
    title: "Build Safe Learning Spaces",
    organization: "Education Bridge PH",
    organizationSlug: "education-bridge-ph",
    location: "Davao City, Philippines",
    description:
      "Constructing earthquake-resistant classrooms for 200 students in remote mountainous areas.",
    category: "Education",
    goalAmount: 300000,
    raisedAmount: 125000,
    supporters: 89,
    daysLeft: 45,
    image: campaignImage,
    urgent: false,
    featured: true,
  },
  {
    id: 3,
    title: "Medical Equipment for Rural Clinic",
    organization: "Healthcare Heroes",
    organizationSlug: "healthcare-heroes",
    location: "Palawan, Philippines",
    description:
      "Essential medical equipment and supplies for a remote clinic serving 1,000+ residents.",
    category: "Healthcare",
    goalAmount: 80000,
    raisedAmount: 62000,
    supporters: 156,
    daysLeft: 8,
    image: campaignImage,
    urgent: true,
    featured: false,
  },
];

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const campaign = campaigns.find((c) => String(c.id) === id);

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-semibold mb-2">Campaign Not Found</h1>
            <p className="text-muted-foreground mb-4">The campaign you are looking for does not exist.</p>
            <Link to="/campaigns">
              <Button variant="default">Browse Campaigns</Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const progress = (campaign.raisedAmount / campaign.goalAmount) * 100;

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
                <img src={campaign.image} alt={campaign.title} className="w-full h-64 object-cover" />
                <div className="absolute top-4 left-4 flex gap-2">
                  {campaign.urgent && <Badge variant="destructive">Urgent</Badge>}
                  <Badge variant="outline" className="bg-white/90 text-foreground">
                    {campaign.category}
                  </Badge>
                </div>
                {campaign.daysLeft <= 15 && (
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    <Clock className="w-3 h-3 inline mr-1" /> {campaign.daysLeft} days left
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-bold mt-6 text-foreground">{campaign.title}</h1>
              <div className="flex items-center text-muted-foreground mt-2">
                <span className="font-medium">{campaign.organization}</span>
                <span className="mx-2">•</span>
                <MapPin className="w-4 h-4 mr-1" /> {campaign.location}
              </div>

              <p className="mt-4 text-muted-foreground">{campaign.description}</p>

              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">₱{campaign.raisedAmount.toLocaleString()} raised</span>
                  <span className="text-muted-foreground">₱{campaign.goalAmount.toLocaleString()} goal</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" /> {campaign.supporters} supporters
                  </div>
                  <div className="flex items-center">
                    <Target className="w-4 h-4 mr-1" /> {Math.round(progress)}% funded
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="p-6">
                <Link to={`/campaigns/${campaign.id}/donate`}>
                  <Button variant="donate" className="w-full">
                    <Heart className="w-4 h-4 mr-2" /> Donate to this Campaign
                  </Button>
                </Link>
                <Link to={`/organizations/${campaign.organizationSlug}`} className="block mt-4">
                  <Button variant="outline" className="w-full">View Organization</Button>
                </Link>
              </Card>

              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-2">Time Remaining</div>
                <div className="text-lg font-semibold">{campaign.daysLeft} days</div>
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
