import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Careers</h1>
          <p className="text-muted-foreground mb-8">
            Were not hiring just yet, but were always excited to meet talented people who share our mission. Check back soon for open roles.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Careers;
