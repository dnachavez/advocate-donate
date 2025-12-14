import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  CreditCard, 
  Package, 
  CheckCircle,
  Target,
  Heart
} from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: Search,
      title: "Discover",
      description: "Browse verified organizations and campaigns that align with your values",
      details: ["Verified organizations", "Transparent impact metrics", "Real-time updates"]
    },
    {
      icon: CreditCard,
      title: "Give",
      description: "Choose between cash donations or pledge specific items that organizations need",
      details: ["Secure payments", "Tax receipts", "Recurring options"]
    },
    {
      icon: Package,
      title: "Coordinate",
      description: "For in-kind donations, coordinate pickup and delivery through our platform",
      details: ["Scheduling system", "Real-time messaging", "Status tracking"]
    },
    {
      icon: CheckCircle,
      title: "Impact",
      description: "Track your contribution's impact and receive updates from organizations",
      details: ["Impact reports", "Photo updates", "Community feedback"]
    }
  ];

  const userTypes = [
    {
      icon: Heart,
      title: "Donors",
      description: "Give cash or items to causes you care about",
      features: ["Browse verified organizations", "Make secure donations", "Track your impact", "Earn recognition badges"]
    },
    {
      icon: Target,
      title: "Organizations",
      description: "Create campaigns and manage donations efficiently",
      features: ["Create fundraising campaigns", "Post item needs", "Manage inventory", "Coordinate logistics"]
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Making Impact Simple & Transparent
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Advocate&Donate connects generosity with genuine need through a transparent, 
            efficient platform that ensures every contribution makes a real difference.
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {steps.map((step, index) => (
            <Card key={index} className="relative p-6 text-center group hover:shadow-lg transition-all duration-300">
              {/* Step Number */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
              </div>

              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <step.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {step.description}
              </p>

              {/* Details */}
              <div className="space-y-2">
                {step.details.map((detail, detailIndex) => (
                  <div key={detailIndex} className="flex items-center justify-center text-xs text-muted-foreground">
                    <CheckCircle className="w-3 h-3 text-success mr-1" />
                    {detail}
                  </div>
                ))}
              </div>

              {/* Connection Arrow (except last) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                  <div className="w-6 h-0.5 bg-border"></div>
                  <div className="border-l-4 border-l-border border-t-2 border-b-2 border-t-transparent border-b-transparent absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-0"></div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* User Types */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center text-foreground mb-4">
            Built for Everyone
          </h3>
          <p className="text-center text-muted-foreground mb-12">
            Whether you're giving, organizing, or in need of support, Advocate&Donate has tools for you.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {userTypes.map((userType, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-impact rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <userType.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-3">
                  {userType.title}
                </h4>
                <p className="text-muted-foreground text-sm mb-4">
                  {userType.description}
                </p>
                <div className="space-y-2">
                  {userType.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-hero rounded-2xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Make a Difference?
          </h3>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of donors, organizations, and recipients who are building 
            stronger communities through Advocate&Donate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" className="bg-white text-primary hover:bg-white/90">
              Get Started Today
            </Button>
            <Button variant="outline" size="xl" className="border-white text-white hover:bg-white/10">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;