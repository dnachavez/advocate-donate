import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const ContactSchema = z.object({
    name: z.string().min(2, "Please enter your full name"),
    email: z.string().email("Enter a valid email address"),
    subject: z.string().min(3, "Subject is required"),
    message: z.string().min(10, "Please provide more details (min 10 characters)"),
  });

  type ContactValues = z.infer<typeof ContactSchema>;

  const form = useForm<ContactValues>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: ContactValues) => {
    setSubmitting(true);
    try {
      // Placeholder submission action; replace with API call or email service.
      await new Promise((r) => setTimeout(r, 800));
      toast({
        title: "Message sent",
        description: "Thanks for reaching out! We'll get back to you shortly.",
      });
      form.reset();
    } catch (e) {
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Contact Us</h1>
          <p className="text-muted-foreground mb-10">
            Have questions, feedback, or partnership inquiries? Send us a message and our team will respond within 1–2 business days.
          </p>

          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-3">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan Dela Cruz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="How can we help?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Tell us more about your inquiry..." className="min-h-[160px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Sending..." : "Send message"}
                    </Button>
                    <a href="mailto:hello@bridgeneeds.ph" className="text-sm text-muted-foreground hover:underline">
                      Or email us directly at hello@bridgeneeds.ph
                    </a>
                  </div>
                </form>
              </Form>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">General inquiries</h3>
                <p className="text-muted-foreground">hello@bridgeneeds.ph</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Partnerships</h3>
                <p className="text-muted-foreground">partners@bridgeneeds.ph</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Press</h3>
                <p className="text-muted-foreground">press@bridgeneeds.ph</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
