import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Users, Target, Verified, ArrowLeft, Heart } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import organizationImage from "@/assets/organization-relief.jpg";
import campaignImage from "@/assets/food-donations.jpg";

const organizations = [
  {
    id: 1,
    name: "Hope Community Center",
    slug: "hope-community-center",
    location: "Manila, Philippines",
    description:
      "Providing food security and shelter support for families in need across Metro Manila with comprehensive community programs.",
    verified: true,
    category: "Food Security",
    supporters: 324,
    activeGoals: 5,
    image: organizationImage,
    totalRaised: "₱125,000",
    urgentNeed: "Emergency Food Packages",
    rating: 4.8,
    founded: "2019",
  },
  {
    id: 2,
    name: "Shelter First Foundation",
    slug: "shelter-first-foundation",
    location: "Cebu City, Philippines",
    description:
      "Building safe homes and providing temporary shelter for disaster-affected families throughout the Visayas region.",
    verified: true,
    category: "Shelter",
    supporters: 156,
    activeGoals: 3,
    image: organizationImage,
    totalRaised: "₱89,500",
    urgentNeed: "Construction Materials",
    rating: 4.9,
    founded: "2020",
  },
  {
    id: 3,
    name: "Education Bridge PH",
    slug: "education-bridge-ph",
    location: "Davao City, Philippines",
    description:
      "Ensuring every child has access to quality education and learning materials through innovative programs.",
    verified: true,
    category: "Education",
    supporters: 278,
    activeGoals: 7,
    image: organizationImage,
    totalRaised: "₱67,200",
    urgentNeed: "School Supplies",
    rating: 4.7,
    founded: "2018",
  },
  {
    id: 4,
    name: "Healthcare Heroes",
    slug: "healthcare-heroes",
    location: "Quezon City, Philippines",
    description:
      "Providing medical assistance and healthcare programs for underserved communities.",
    verified: true,
    category: "Healthcare",
    supporters: 189,
    activeGoals: 4,
    image: organizationImage,
    totalRaised: "₱95,300",
    urgentNeed: "Medical Equipment",
    rating: 4.8,
    founded: "2021",
  },
];

const orgCampaigns = [
  {
    id: 1,
    title: "Emergency Food Distribution for Typhoon Victims",
    organizationSlug: "hope-community-center",
    organization: "Hope Community Center",
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
  },
  {
    id: 2,
    title: "Build Safe Learning Spaces",
    organizationSlug: "education-bridge-ph",
    organization: "Education Bridge PH",
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
  },
];

const OrganizationDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const org = organizations.find((o) => o.slug === slug);

  if (!org) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-semibold mb-2">Organization Not Found</h1>
            <p className="text-muted-foreground mb-4">The organization you are looking for does not exist.</p>
            <Link to="/organizations">
              <Button variant="default">Browse Organizations</Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const campaigns = orgCampaigns.filter((c) => c.organizationSlug === org.slug);

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
                <img src={org.image} alt={org.name} className="w-full h-64 object-cover" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge variant="default" className="bg-success text-success-foreground">
                    <Verified className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                  <Badge variant="outline" className="bg-white/90 text-foreground">
                    {org.category}
                  </Badge>
                </div>
              </div>

              <h1 className="text-3xl font-bold mt-6 text-foreground">{org.name}</h1>
              <div className="flex items-center text-muted-foreground mt-2">
                <MapPin className="w-4 h-4 mr-1" /> {org.location}
              </div>

              <p className="mt-4 text-muted-foreground">{org.description}</p>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <Card className="p-4 text-center">
                  <div className="text-xs text-muted-foreground">Supporters</div>
                  <div className="text-xl font-semibold">{org.supporters}</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-xs text-muted-foreground">Active Goals</div>
                  <div className="text-xl font-semibold">{org.activeGoals}</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-xs text-muted-foreground">Total Raised</div>
                  <div className="text-xl font-semibold text-success">{org.totalRaised}</div>
                </Card>
              </div>

              <div className="bg-impact-light rounded-lg p-4 mt-6">
                <div className="text-xs text-impact-dark font-medium">Urgent Need</div>
                <div className="text-sm font-semibold text-impact">{org.urgentNeed}</div>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-2">Founded</div>
                <div className="text-lg font-semibold">{org.founded}</div>
                <Link to={`/organizations/${org.slug}/donate`}>
                  <Button variant="donate" className="w-full mt-6">
                    <Heart className="w-4 h-4 mr-2" /> Donate to Organization
                  </Button>
                </Link>
              </Card>

              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-2">Rating</div>
                <div className="text-lg font-semibold">★ {org.rating}</div>
              </Card>
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
                    <img src={c.image} alt={c.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="outline" className="bg-white/90">{c.category}</Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">{c.title}</h3>
                    <div className="text-xs text-muted-foreground mb-2 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" /> {c.location}
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
