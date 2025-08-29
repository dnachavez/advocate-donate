import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Api = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">API Documentation</h1>
          <p className="text-muted-foreground mb-8">
            Our public API will enable developers and partners to integrate with Bridge Needs. This page is a placeholder and documentation will be published soon.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Api;
