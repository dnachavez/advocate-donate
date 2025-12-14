import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Users, 
  Target, 
  Shield,
  Award,
  Globe,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-community.jpg";

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Trust & Transparency",
      description: "Every organization is verified and all donations are tracked transparently."
    },
    {
      icon: Heart,
      title: "Impact First",
      description: "We prioritize real, measurable impact in communities that need it most."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Built by the community, for the community, with feedback at every step."
    },
    {
      icon: Globe,
      title: "Accessible to All",
      description: "Breaking down barriers to giving and receiving help across all communities."
    }
  ];

  const stats = [
    { label: "Organizations Helped", value: "150+", icon: Target },
    { label: "Successful Campaigns", value: "500+", icon: Award },
    { label: "Community Members", value: "10K+", icon: Users },
    { label: "Impact Created", value: "₱2.5M+", icon: Heart }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Community impact"
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-6">
            About Advocate&Donate
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Bridging the Gap Between
            <span className="block text-primary">Generosity & Need</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            We're building a transparent, efficient platform that connects donors, 
            organizations, and recipients to create lasting impact in communities 
            across the Philippines.
          </p>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Advocate&Donate was founded on the belief that every person deserves 
                access to basic necessities like food, shelter, education, and healthcare. 
                We saw that generous hearts existed alongside urgent needs, but the 
                connection between them wasn't always clear or efficient.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Our platform eliminates the barriers between giving and receiving, 
                ensuring that every contribution—whether cash or in-kind—reaches 
                the people and causes that need it most.
              </p>
              <Link to="/auth">
                <Button variant="hero" size="lg">
                  Join Our Mission
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            <Card className="p-8 bg-gradient-card">
              <h3 className="text-2xl font-semibold text-foreground mb-6">
                Platform Statistics
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              These principles guide everything we do, from product development 
              to community engagement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {value.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How We Started */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">
            How Advocate&Donate Began
          </h2>
          <div className="prose prose-lg mx-auto text-muted-foreground">
            <p className="mb-6">
              Advocate&Donate started as a response to the challenges we witnessed 
              during natural disasters in the Philippines. We saw incredible 
              generosity from people wanting to help, but also saw how difficult 
              it was to ensure donations reached the right people at the right time.
            </p>
            <p className="mb-6">
              Traditional charity models often lacked transparency, had high 
              overhead costs, or couldn't efficiently match specific needs with 
              available resources. We knew technology could solve these problems.
            </p>
            <p className="mb-8">
              Today, Advocate&Donate serves as the digital infrastructure that makes 
              giving more transparent, efficient, and impactful for everyone involved.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" size="lg">
              Browse Organizations
            </Button>
            <Button variant="outline" size="lg">
              Start Giving Today
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-impact text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Be Part of Something Bigger
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Whether you're a donor, organization, or someone in need of support, 
            Advocate&Donate has a place for you in our growing community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" className="bg-white text-primary hover:bg-white/90">
              Get Started Today
            </Button>
            <Button variant="outline" size="xl" className="border-white text-white hover:bg-white/10">
              Contact Our Team
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;