import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Press = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Press Kit</h1>
          <p className="text-muted-foreground mb-8">
            Media resources, brand assets, and company information will be available here. For press inquiries, please contact hello@bridgeneeds.ph.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Press;
