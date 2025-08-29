import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Target, Verified } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import organizationImage from "@/assets/organization-relief.jpg";

const FeaturedOrganizations = () => {
  const navigate = useNavigate();
  const organizations = [
    {
      id: 1,
      name: "Hope Community Center",
      slug: "hope-community-center",
      location: "Manila, Philippines",
      description: "Providing food security and shelter support for families in need across Metro Manila.",
      verified: true,
      category: "Food Security",
      supporters: 324,
      activeGoals: 5,
      image: organizationImage,
      totalRaised: "₱125,000",
      urgentNeed: "Emergency Food Packages"
    },
    {
      id: 2,
      name: "Shelter First Foundation",
      slug: "shelter-first-foundation",
      location: "Cebu City, Philippines",
      description: "Building safe homes and providing temporary shelter for disaster-affected families.",
      verified: true,
      category: "Shelter",
      supporters: 156,
      activeGoals: 3,
      image: organizationImage,
      totalRaised: "₱89,500",
      urgentNeed: "Construction Materials"
    },
    {
      id: 3,
      name: "Education Bridge PH",
      slug: "education-bridge-ph",
      location: "Davao City, Philippines",
      description: "Ensuring every child has access to quality education and learning materials.",
      verified: true,
      category: "Education",
      supporters: 278,
      activeGoals: 7,
      image: organizationImage,
      totalRaised: "₱67,200",
      urgentNeed: "School Supplies"
    }
  ];

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
                  <Badge variant={org.verified ? "default" : "secondary"} className="bg-success text-success-foreground">
                    <Verified className="w-3 h-3 mr-1" />
                    Verified
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
                    {org.activeGoals} active goals
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