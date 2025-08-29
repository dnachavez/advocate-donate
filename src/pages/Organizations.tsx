import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Target, 
  Verified,
  Grid3X3,
  List
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import organizationImage from "@/assets/organization-relief.jpg";

const Organizations = () => {
  const navigate = useNavigate();
  const organizations = [
    {
      id: 1,
      name: "Hope Community Center",
      slug: "hope-community-center",
      location: "Manila, Philippines",
      description: "Providing food security and shelter support for families in need across Metro Manila with comprehensive community programs.",
      verified: true,
      category: "Food Security",
      supporters: 324,
      activeGoals: 5,
      image: organizationImage,
      totalRaised: "₱125,000",
      urgentNeed: "Emergency Food Packages",
      rating: 4.8,
      founded: "2019"
    },
    {
      id: 2,
      name: "Shelter First Foundation",
      slug: "shelter-first-foundation",
      location: "Cebu City, Philippines",
      description: "Building safe homes and providing temporary shelter for disaster-affected families throughout the Visayas region.",
      verified: true,
      category: "Shelter",
      supporters: 156,
      activeGoals: 3,
      image: organizationImage,
      totalRaised: "₱89,500",
      urgentNeed: "Construction Materials",
      rating: 4.9,
      founded: "2020"
    },
    {
      id: 3,
      name: "Education Bridge PH",
      slug: "education-bridge-ph",
      location: "Davao City, Philippines",
      description: "Ensuring every child has access to quality education and learning materials through innovative programs.",
      verified: true,
      category: "Education",
      supporters: 278,
      activeGoals: 7,
      image: organizationImage,
      totalRaised: "₱67,200",
      urgentNeed: "School Supplies",
      rating: 4.7,
      founded: "2018"
    },
    // Add more organizations for demonstration
    {
      id: 4,
      name: "Healthcare Heroes",
      slug: "healthcare-heroes",
      location: "Quezon City, Philippines",
      description: "Providing medical assistance and healthcare programs for underserved communities.",
      verified: true,
      category: "Healthcare",
      supporters: 189,
      activeGoals: 4,
      image: organizationImage,
      totalRaised: "₱95,300",
      urgentNeed: "Medical Equipment",
      rating: 4.8,
      founded: "2021"
    }
  ];

  const categories = [
    "All Categories",
    "Food Security",
    "Shelter",
    "Education", 
    "Healthcare",
    "Emergency Relief",
    "Clothing & Essentials"
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
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={category === "All Categories" ? "default" : "outline"}
                  size="sm"
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
                {organizations.length} Organizations Found
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <Card
                key={org.id}
                className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card cursor-pointer"
                onClick={() => navigate(`/organizations/${org.slug}`)}
              >
                {/* Organization Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={org.image}
                    alt={org.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge variant="default" className="bg-success text-success-foreground">
                      <Verified className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="outline" className="bg-white/90 text-foreground">
                      {org.category}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                      Founded {org.founded}
                    </div>
                  </div>
                </div>

                {/* Organization Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {org.name}
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      ★ {org.rating}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-muted-foreground text-sm mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    {org.location}
                  </div>

                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {org.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {org.supporters} supporters
                    </div>
                    <div className="flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      {org.activeGoals} active
                    </div>
                    <div className="font-semibold text-success">
                      {org.totalRaised}
                    </div>
                  </div>

                  {/* Urgent Need */}
                  <div className="bg-impact-light rounded-lg p-3 mb-4">
                    <div className="text-xs text-impact-dark font-medium mb-1">Urgent Need</div>
                    <div className="text-sm font-semibold text-impact">{org.urgentNeed}</div>
                  </div>

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
                      variant="donate"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/donate`);
                      }}
                    >
                      Donate Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Organizations
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Organizations;