import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  UtensilsCrossed, 
  Home, 
  GraduationCap, 
  Heart, 
  Stethoscope, 
  Droplets,
  Baby,
  Accessibility,
  Leaf,
  Building2,
  ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import foodImage from "@/assets/food-donations.jpg";

const CategoriesSection = () => {
  const [categories, setCategories] = useState([
    {
      icon: UtensilsCrossed,
      name: "Food & Nutrition",
      description: "Meals, groceries, and nutrition programs",
      activeCampaigns: 0,
      urgentNeeds: 0,
      totalRaised: 0,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      image: foodImage
    },
    {
      icon: Stethoscope,
      name: "Healthcare",
      description: "Medical assistance, health programs",
      activeCampaigns: 0,
      urgentNeeds: 0,
      totalRaised: 0,
      color: "text-red-600",
      bgColor: "bg-red-50",
      image: foodImage
    },
    {
      icon: GraduationCap,
      name: "Education",
      description: "School supplies, scholarships, programs",
      activeCampaigns: 0,
      urgentNeeds: 0,
      totalRaised: 0,
      color: "text-green-600",
      bgColor: "bg-green-50",
      image: foodImage
    },
    {
      icon: Heart,
      name: "Disaster Relief",
      description: "Disaster response, crisis support",
      activeCampaigns: 0,
      urgentNeeds: 0,
      totalRaised: 0,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      image: foodImage
    },
    {
      icon: Home,
      name: "Housing & Shelter", 
      description: "Emergency shelter, housing assistance",
      activeCampaigns: 0,
      urgentNeeds: 0,
      totalRaised: 0,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      image: foodImage
    },
    {
      icon: Droplets,
      name: "Clean Water",
      description: "Safe drinking water and sanitation",
      activeCampaigns: 0,
      urgentNeeds: 0,
      totalRaised: 0,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      image: foodImage
    },
    {
      icon: Baby,
      name: "Children & Youth",
      description: "Child welfare and youth empowerment",
      activeCampaigns: 0,
      urgentNeeds: 0,
      totalRaised: 0,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      image: foodImage
    },
    {
      icon: Accessibility,
      name: "Elderly Care",
      description: "Support for senior citizens",
      activeCampaigns: 0,
      urgentNeeds: 0,
      totalRaised: 0,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      image: foodImage
    },
    {
      icon: Leaf,
      name: "Environment",
      description: "Conservation and sustainability",
      activeCampaigns: 0,
      urgentNeeds: 0,
      totalRaised: 0,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      image: foodImage
    },
    {
      icon: Building2,
      name: "Community Development",
      description: "Infrastructure and local projects",
      activeCampaigns: 0,
      urgentNeeds: 0,
      totalRaised: 0,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      image: foodImage
    }
  ]);
  const [loading, setLoading] = useState(true);

  // Mapping between UI category names and possible Database category names
  const CATEGORY_MAPPING: Record<string, string[]> = {
    "Food & Nutrition": ["Food & Nutrition", "Food Security", "Hunger", "Food", "Nutrition"],
    "Healthcare": ["Healthcare", "Health", "Medical"],
    "Education": ["Education", "Schooling"],
    "Disaster Relief": ["Disaster Relief", "Emergency Relief", "Emergency", "Crisis Response"],
    "Housing & Shelter": ["Housing & Shelter", "Shelter & Housing", "Housing", "Shelter", "Homelessness"],
    "Clean Water": ["Clean Water", "Water", "Sanitation", "WASH"],
    "Children & Youth": ["Children & Youth", "Children", "Youth", "Kids"],
    "Elderly Care": ["Elderly Care", "Seniors", "Elderly", "Aged Care"],
    "Environment": ["Environment", "Nature", "Climate", "Sustainability"],
    "Community Development": ["Community Development", "Community", "Development"]
  };

  useEffect(() => {
    const fetchCategoryStats = async () => {
      try {
        setLoading(true);
        const categoryNames = [
          "Food & Nutrition",
          "Healthcare",
          "Education",
          "Disaster Relief",
          "Housing & Shelter",
          "Clean Water",
          "Children & Youth",
          "Elderly Care",
          "Environment",
          "Community Development"
        ];

        const now = new Date().toISOString();

        const categoryStats = await Promise.all(
          categoryNames.map(async (categoryName) => {
            const dbCategories = CATEGORY_MAPPING[categoryName] || [categoryName];
            
            // Get active campaigns with their stats
            const { data: campaigns, error } = await supabase
              .from('campaigns')
              .select('goal_amount, raised_amount, is_urgent')
              .in('category', dbCategories)
              .eq('status', 'active')
              .gt('end_date', now);

            if (error) {
              console.error(`Error fetching stats for ${categoryName}:`, error);
              return {
                activeCampaigns: 0,
                urgentNeeds: 0,
                totalRaised: 0,
                totalGoal: 0
              };
            }

            const activeCampaigns = campaigns.length;
            const urgentNeeds = campaigns.filter(c => c.is_urgent).length;
            const totalRaised = campaigns.reduce((sum, c) => sum + (c.raised_amount || 0), 0);
            const totalGoal = campaigns.reduce((sum, c) => sum + (c.goal_amount || 0), 0);

            return {
              activeCampaigns,
              urgentNeeds,
              totalRaised,
              totalGoal
            };
          })
        );

        setCategories(prev => 
          prev.map((category, index) => ({
            ...category,
            activeCampaigns: categoryStats[index].activeCampaigns,
            urgentNeeds: categoryStats[index].urgentNeeds,
            totalRaised: categoryStats[index].totalRaised,
            totalGoal: categoryStats[index].totalGoal
          }))
        );
      } catch (error) {
        console.error('Error fetching category stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryStats();
  }, []);

  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `₱${(amount / 1000).toFixed(1)}K`;
    }
    return `₱${amount.toLocaleString()}`;
  };

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Impact Categories
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Choose Your Cause
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From emergency relief to long-term community development, find the cause that 
            resonates with you and make a meaningful impact.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {categories.map((category, index) => (
            <Card key={index} className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                <category.icon className="w-full h-full" />
              </div>

              <div className="p-6 relative">
                {/* Icon and Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${category.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <category.icon className={`w-6 h-6 ${category.color}`} />
                  </div>
                  {category.urgentNeeds > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {category.urgentNeeds} urgent
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {category.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{loading ? '...' : category.activeCampaigns} active campaigns</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Progress Indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Raised</span>
                    <span className="font-medium text-success">
                      {loading ? '...' : formatAmount(category.totalRaised)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-gradient-impact h-1.5 rounded-full transition-all duration-500"
                      style={{ 
                        width: loading 
                          ? '20%' 
                          : `${(category as any).totalGoal > 0 
                              ? Math.min((category.totalRaised / (category as any).totalGoal) * 100, 100) 
                              : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-impact/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-card rounded-2xl p-8 border border-border">
          <h3 className="text-2xl font-semibold text-foreground mb-4">
            Can't Find Your Cause?
          </h3>
          <p className="text-muted-foreground mb-6">
            Explore all categories or search for specific organizations and campaigns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" size="lg">
              Browse All Categories
            </Button>
            <Button variant="outline" size="lg">
              Search Organizations
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;