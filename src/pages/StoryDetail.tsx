import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, Link } from "react-router-dom";
import { getStoryByIdOrSlug, stories } from "@/lib/stories";
import { Calendar, Users, ArrowLeft } from "lucide-react";

const StoryDetail = () => {
  const { slug } = useParams();
  const story = slug ? getStoryByIdOrSlug(slug) : undefined;

  if (!story) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4 text-foreground">Story not found</h1>
            <Link to="/stories" className="text-primary font-semibold">Back to Stories</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const related = stories.filter((s) => s.id !== story.id).slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-20">
        <section className="py-6 px-4">
          <div className="max-w-5xl mx-auto">
            <Link to="/stories" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Stories
            </Link>
          </div>
        </section>

        <section className="px-4 pb-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-4 flex items-center gap-4">
              <Badge variant="secondary">{story.category}</Badge>
              <div className="flex items-center text-muted-foreground text-sm">
                <Calendar className="w-4 h-4 mr-1" />
                {story.date}
              </div>
              <div className="flex items-center text-success text-sm">
                <Users className="w-4 h-4 mr-1" />
                {story.impact}
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3">{story.title}</h1>
            <p className="text-primary font-semibold mb-6">{story.organization}</p>

            <div className="rounded-lg overflow-hidden mb-8">
              <img src={story.image} alt={story.title} className="w-full h-[320px] md:h-[460px] object-cover" />
            </div>

            <article className="prose prose-neutral dark:prose-invert max-w-none">
              {story.content.map((p, idx) => (
                <p key={idx} className="leading-relaxed">{p}</p>
              ))}
            </article>
          </div>
        </section>

        {related.length > 0 && (
          <section className="py-12 px-4 bg-muted/40">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">More impact stories</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {related.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="md:flex">
                        <div className="md:w-1/3">
                          <img src={item.image} alt={item.title} className="w-full h-48 md:h-full object-cover" />
                        </div>
                        <div className="md:w-2/3 p-5">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="secondary">{item.category}</Badge>
                            <div className="flex items-center text-muted-foreground text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              {item.date}
                            </div>
                          </div>
                          <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                          <p className="text-primary font-semibold mb-3">{item.organization}</p>
                          <Link to={`/stories/${item.slug}`}>
                            <Button variant="outline" size="sm">Read Full Story</Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default StoryDetail;
