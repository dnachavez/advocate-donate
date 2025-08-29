import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Calendar } from "lucide-react";
import { stories } from "@/lib/stories";
import { Link } from "react-router-dom";

const Stories = () => {
  // Using shared stories from src/lib/stories

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Impact Stories
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Real stories of hope, resilience, and positive change made possible by our community of donors and organizations.
            </p>
          </div>
        </section>

        {/* Stories Grid */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-8">
              {stories.map((story) => (
                <Card key={story.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="md:flex">
                      <div className="md:w-1/3">
                        <img 
                          src={story.image} 
                          alt={story.title}
                          className="w-full h-64 md:h-full object-cover"
                        />
                      </div>
                      <div className="md:w-2/3 p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <Badge variant="secondary">{story.category}</Badge>
                          <div className="flex items-center text-muted-foreground text-sm">
                            <Calendar className="w-4 h-4 mr-1" />
                            {story.date}
                          </div>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                          {story.title}
                        </h3>
                        
                        <p className="text-primary font-semibold mb-3">
                          {story.organization}
                        </p>
                        
                        <p className="text-muted-foreground mb-4 leading-relaxed">
                          {story.excerpt}
                        </p>
                        
                        <div className="flex items-center gap-6">
                          <div className="flex items-center text-success">
                            <Users className="w-5 h-5 mr-2" />
                            <span className="font-semibold">{story.impact}</span>
                          </div>
                          <Link to={`/stories/${story.slug}`} className="text-primary hover:text-primary-dark font-semibold">
                            Read Full Story →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-muted text-center">
          <div className="max-w-4xl mx-auto">
            <Heart className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Be Part of the Next Success Story
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Every donation, no matter the size, creates ripples of positive change in communities that need it most.
            </p>
            <a 
              href="/organizations" 
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors inline-block"
            >
              Start Giving Today
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Stories;