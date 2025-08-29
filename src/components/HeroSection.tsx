import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Target, Heart } from "lucide-react";
import heroImage from "@/assets/hero-community.jpg";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  const stats = [
    { icon: Users, label: "Organizations Helped", value: "150+" },
    { icon: Target, label: "Campaigns Active", value: "89" },
    { icon: Heart, label: "Lives Impacted", value: "10K+" }
  ];

  return (
    <section className="relative bg-gradient-hero min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Community coming together to help"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-impact/60" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Bridge Needs,
              <span className="block text-impact-light">Build Hope</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl">
              Connect donors, organizations, and recipients in a seamless platform 
              for impactful giving. Make a difference with cash donations or in-kind 
              contributions to verified causes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Button
                variant="hero"
                size="xl"
                className="group"
                onClick={() => navigate("/campaigns")}
              >
                Start Giving Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                onClick={() => navigate("/organizations")}
              >
                Browse Organizations
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Visual - could be additional content or form */}
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-hero">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Impact</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-white/90">
                  <span>Food Security</span>
                  <span className="font-semibold">$2,450 raised</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-impact h-2 rounded-full w-3/4"></div>
                </div>
                <div className="flex items-center justify-between text-white/90">
                  <span>Shelter Support</span>
                  <span className="font-semibold">89 items pledged</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-success h-2 rounded-full w-1/2"></div>
                </div>
                <Button variant="impact" className="w-full mt-6"
                  onClick={() => navigate("/campaigns")}
                >
                  Join These Causes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;