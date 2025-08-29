import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Target, 
  Clock,
  Heart,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import campaignImage from "@/assets/food-donations.jpg";

const Campaigns = () => {
  const navigate = useNavigate();
  const campaigns = [
    {
      id: 1,
      title: "Emergency Food Distribution for Typhoon Victims",
      organization: "Hope Community Center",
      location: "Manila, Philippines",
      description: "Providing immediate food relief to 500 families affected by recent typhoon damage in Metro Manila.",
      category: "Emergency Relief",
      goalAmount: 150000,
      raisedAmount: 95000,
      supporters: 234,
      daysLeft: 12,
      image: campaignImage,
      urgent: true,
      featured: true
    },
    {
      id: 2,
      title: "Build Safe Learning Spaces",
      organization: "Education Bridge PH",
      location: "Davao City, Philippines", 
      description: "Constructing earthquake-resistant classrooms for 200 students in remote mountainous areas.",
      category: "Education",
      goalAmount: 300000,
      raisedAmount: 125000,
      supporters: 89,
      daysLeft: 45,
      image: campaignImage,
      urgent: false,
      featured: true
    },
    {
      id: 3,
      title: "Medical Equipment for Rural Clinic",
      organization: "Healthcare Heroes",
      location: "Palawan, Philippines",
      description: "Essential medical equipment and supplies for a remote clinic serving 1,000+ residents.",
      category: "Healthcare",
      goalAmount: 80000,
      raisedAmount: 62000,
      supporters: 156,
      daysLeft: 8,
      image: campaignImage,
      urgent: true,
      featured: false
    },
    {
      id: 4,
      title: "Shelter Rebuilding Program",
      organization: "Shelter First Foundation",
      location: "Cebu City, Philippines",
      description: "Rebuilding homes for families displaced by natural disasters using sustainable materials.",
      category: "Shelter", 
      goalAmount: 450000,
      raisedAmount: 280000,
      supporters: 342,
      daysLeft: 60,
      image: campaignImage,
      urgent: false,
      featured: false
    }
  ];

  const categories = [
    "All Categories",
    "Emergency Relief",
    "Education", 
    "Healthcare",
    "Food Security",
    "Shelter",
    "Clothing & Essentials"
  ];

  const sortOptions = [
    "Most Recent",
    "Ending Soon", 
    "Most Funded",
    "Most Supporters"
  ];

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
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 4).map((category) => (
                <Button
                  key={category}
                  variant={category === "All Categories" ? "default" : "outline"}
                  size="sm"
                >
                  {category}
                </Button>
              ))}
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-1" />
                More
              </Button>
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

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {campaigns.filter(c => c.featured).map((campaign) => (
              <Card
                key={campaign.id}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate(`/campaigns/${campaign.id}`)}
              >
                <div className="relative">
                  <img
                    src={campaign.image}
                    alt={campaign.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {campaign.urgent && (
                      <Badge variant="destructive" className="animate-pulse">
                        Urgent
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-white/90">
                      {campaign.category}
                    </Badge>
                  </div>
                  {campaign.daysLeft <= 15 && (
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {campaign.daysLeft} days left
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {campaign.title}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <span className="font-medium">{campaign.organization}</span>
                      <span className="mx-2">•</span>
                      <MapPin className="w-3 h-3 mr-1" />
                      {campaign.location}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {campaign.description}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">₱{campaign.raisedAmount.toLocaleString()} raised</span>
                      <span className="text-muted-foreground">₱{campaign.goalAmount.toLocaleString()} goal</span>
                    </div>
                    <Progress value={(campaign.raisedAmount / campaign.goalAmount) * 100} className="h-2" />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {campaign.supporters} supporters
                    </div>
                    <div className="flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      {Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)}% funded
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/campaigns/${campaign.id}`);
                      }}
                    >
                      Learn More
                    </Button>
                    <Button
                      variant="donate"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/donate`);
                      }}
                    >
                      <Heart className="w-4 h-4 mr-1" />
                      Donate Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* All Campaigns */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              All Campaigns ({campaigns.length})
            </h2>
            <select className="px-4 py-2 border border-border rounded-lg bg-background text-foreground">
              {sortOptions.map(option => (
                <option key={option} value={option.toLowerCase().replace(' ', '-')}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate(`/campaigns/${campaign.id}`)}
              >
                <div className="relative">
                  <img
                    src={campaign.image}
                    alt={campaign.title}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {campaign.urgent && (
                      <Badge variant="destructive">
                        Urgent
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {campaign.title}
                    </h3>
                    <div className="text-xs text-muted-foreground">
                      by {campaign.organization}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <Progress value={(campaign.raisedAmount / campaign.goalAmount) * 100} className="h-1.5 mb-2" />
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">₱{campaign.raisedAmount.toLocaleString()}</span>
                      <span className="text-muted-foreground">{Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{campaign.supporters} supporters</span>
                    <span>{campaign.daysLeft} days left</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Campaigns
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Campaigns;