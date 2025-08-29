import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Search, Filter, MapPin, Calendar, Target } from "lucide-react";
import { Link } from "react-router-dom";

const Donate = () => {
  const [selectedAmount, setSelectedAmount] = useState("");
  const [donationType, setDonationType] = useState("one-time");

  const suggestedAmounts = [50, 100, 250, 500, 1000, 2500];
  
  const urgentCampaigns = [
    {
      id: 1,
      title: "Emergency Food Relief for Typhoon Victims",
      organization: "Metro Manila Relief Foundation",
      category: "Disaster Relief",
      location: "Metro Manila",
      raised: 156750,
      goal: 500000,
      daysLeft: 12,
      image: "/placeholder.svg",
      urgent: true
    },
    {
      id: 2,
      title: "Children's Education Scholarship Fund",
      organization: "Education for All PH",
      category: "Education",
      location: "Cebu City",
      raised: 89200,
      goal: 200000,
      daysLeft: 25,
      image: "/placeholder.svg",
      urgent: false
    },
    {
      id: 3,
      title: "Medical Equipment for Rural Clinic",
      organization: "Healthcare Access Initiative",
      category: "Healthcare",
      location: "Davao",
      raised: 234100,
      goal: 350000,
      daysLeft: 8,
      image: "/placeholder.svg",
      urgent: true
    }
  ];

  const categories = [
    "All Categories",
    "Disaster Relief",
    "Education", 
    "Healthcare",
    "Food Security",
    "Clean Water",
    "Housing",
    "Environment",
    "Children & Youth",
    "Elderly Care"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-hero text-white">
          <div className="max-w-4xl mx-auto text-center">
            <Heart className="w-16 h-16 text-white mx-auto mb-6" />
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Make a Difference Today
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Your generosity creates ripples of positive change. Choose a cause close to your heart and see your impact in real-time.
            </p>
          </div>
        </section>

        {/* Quick Donate Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Quick Donation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Donation Type */}
                <div className="flex justify-center gap-4">
                  <Button 
                    variant={donationType === "one-time" ? "default" : "outline"}
                    onClick={() => setDonationType("one-time")}
                  >
                    One-Time
                  </Button>
                  <Button 
                    variant={donationType === "monthly" ? "default" : "outline"}
                    onClick={() => setDonationType("monthly")}
                  >
                    Monthly
                  </Button>
                </div>

                {/* Amount Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-center mb-4">Choose Amount</h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {suggestedAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant={selectedAmount === amount.toString() ? "default" : "outline"}
                        onClick={() => setSelectedAmount(amount.toString())}
                        className="h-12"
                      >
                        ₱{amount}
                      </Button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₱</span>
                    <Input 
                      placeholder="Custom amount"
                      value={selectedAmount}
                      onChange={(e) => setSelectedAmount(e.target.value)}
                      className="pl-8"
                      type="number"
                    />
                  </div>
                </div>

                {/* Cause Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-center mb-4">Where should we direct your donation?</h3>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose where your donation helps most" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="most-urgent">Most Urgent Causes</SelectItem>
                      <SelectItem value="disaster-relief">Disaster Relief</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="food-security">Food Security</SelectItem>
                      <SelectItem value="local">My Local Community</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" size="lg" disabled={!selectedAmount}>
                  {donationType === "monthly" ? "Start Monthly Giving" : "Donate Now"}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Your donation is secure and you'll receive a receipt for tax purposes.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Browse Campaigns */}
        <section className="py-16 px-4 bg-muted">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Browse Campaigns
              </h2>
              <p className="text-xl text-muted-foreground">
                Find specific causes and organizations that align with your values
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="Search campaigns, organizations, or causes..."
                  className="pl-10"
                />
              </div>
              <Select>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase().replace(/\s+/g, '-')}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  <SelectItem value="ncr">Metro Manila</SelectItem>
                  <SelectItem value="cebu">Cebu</SelectItem>
                  <SelectItem value="davao">Davao</SelectItem>
                  <SelectItem value="baguio">Baguio</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>

            {/* Campaign Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {urgentCampaigns.map((campaign) => (
                <Card key={campaign.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img 
                      src={campaign.image} 
                      alt={campaign.title}
                      className="w-full h-48 object-cover"
                    />
                    {campaign.urgent && (
                      <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
                        Urgent
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">{campaign.category}</Badge>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <MapPin className="w-3 h-3 mr-1" />
                        {campaign.location}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {campaign.title}
                    </h3>
                    
                    <p className="text-primary font-medium text-sm mb-4">
                      {campaign.organization}
                    </p>
                    
                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                          ₱{campaign.raised.toLocaleString()} raised
                        </span>
                        <span className="text-muted-foreground">
                          {Math.round((campaign.raised / campaign.goal) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-success h-2 rounded-full" 
                          style={{ width: `${Math.min((campaign.raised / campaign.goal) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">
                          <Target className="w-3 h-3 inline mr-1" />
                          ₱{campaign.goal.toLocaleString()} goal
                        </span>
                        <span className="text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {campaign.daysLeft} days left
                        </span>
                      </div>
                    </div>
                    
                    <Link to={`/campaigns/${campaign.id}/donate`} className="block">
                      <Button className="w-full" variant="default">Donate Now</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Campaigns
              </Button>
            </div>
          </div>
        </section>

        {/* Impact Statement */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-8">
              Your Impact Matters
            </h2>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">₱12.5M</div>
                <div className="text-muted-foreground">Total donated this year</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">45K+</div>
                <div className="text-muted-foreground">People helped</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">280+</div>
                <div className="text-muted-foreground">Active campaigns</div>
              </div>
            </div>
            <p className="text-xl text-muted-foreground">
              Every donation creates a ripple effect of positive change in communities across the Philippines.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Donate;