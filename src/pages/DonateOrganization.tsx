import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, ArrowLeft, MapPin, Verified } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import organizationImage from "@/assets/organization-relief.jpg";

// Minimal mock data to render org context
const organizations = [
  {
    slug: "hope-community-center",
    name: "Hope Community Center",
    location: "Manila, Philippines",
    category: "Food Security",
    verified: true,
    image: organizationImage,
  },
  {
    slug: "education-bridge-ph",
    name: "Education Bridge PH",
    location: "Davao City, Philippines",
    category: "Education",
    verified: true,
    image: organizationImage,
  },
];

const DonateOrganization = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const org = organizations.find((o) => o.slug === slug);

  const [selectedAmount, setSelectedAmount] = useState("");
  const [donationType, setDonationType] = useState("one-time");

  const suggestedAmounts = [250, 500, 1000, 2500, 5000, 10000];

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
            <p className="text-muted-foreground mb-4">The organization you are trying to donate to does not exist.</p>
            <Link to="/organizations">
              <Button variant="default">Browse Organizations</Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20">
        <section className="py-8 px-4 bg-muted/30 border-b border-border">
          <div className="max-w-5xl mx-auto">
            <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div className="flex items-center gap-4">
              <img src={org.image} alt={org.name} className="w-16 h-16 rounded-md object-cover" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">Donate to {org.name}</h1>
                  {org.verified && (
                    <Badge variant="default" className="bg-success text-success-foreground">
                      <Verified className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-white/90 text-foreground">{org.category}</Badge>
                </div>
                <div className="text-sm text-muted-foreground flex items-center mt-1">
                  <MapPin className="w-3 h-3 mr-1" /> {org.location}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Complete Your Donation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                      min={1}
                    />
                  </div>
                </div>

                <Button className="w-full" size="lg" disabled={!selectedAmount}>
                  <Heart className="w-4 h-4 mr-2" />
                  {donationType === "monthly" ? "Start Monthly Giving" : "Donate Now"}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Your donation is secure and you'll receive a receipt for tax purposes.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DonateOrganization;
