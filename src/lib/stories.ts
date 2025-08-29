export type Story = {
  id: number;
  slug: string;
  title: string;
  organization: string;
  category: string;
  impact: string;
  date: string;
  excerpt: string;
  content: string[]; // paragraphs
  image: string;
};

export const stories: Story[] = [
  {
    id: 1,
    slug: "rebuilding-lives-after-typhoon-aftermath",
    title: "Rebuilding Lives After Typhoon Aftermath",
    organization: "Manila Relief Foundation",
    category: "Disaster Relief",
    impact: "500 families helped",
    date: "November 2024",
    excerpt:
      "Through community donations, we provided emergency shelter and supplies to families affected by the recent typhoon, helping them rebuild their lives.",
    content: [
      "In the immediate aftermath of the typhoon, volunteers mobilized across Metro Manila and nearby provinces to distribute food packs, medicine, and hygiene kits.",
      "With the help of donors on BridgeNeeds, we established temporary shelters and provided cash assistance so families could purchase essentials and begin repairs.",
      "Within just four weeks, over 500 families received targeted support. Our next phase focuses on resilient housing and livelihood restart kits.",
    ],
    image: "/placeholder.svg",
  },
  {
    id: 2,
    slug: "feeding-program-reaches-rural-communities",
    title: "Feeding Program Reaches Rural Communities",
    organization: "Nutrition First PH",
    category: "Food Security",
    impact: "2,000 children fed daily",
    date: "October 2024",
    excerpt:
      "Our school feeding program expanded to remote villages, ensuring no child goes to school hungry. The impact on learning outcomes has been remarkable.",
    content: [
      "Local teachers helped identify the most food-insecure students, allowing us to tailor weekly menus with local produce.",
      "Attendance improved by 18% on average, and preliminary tests show improved focus and energy during classes.",
      "The program now runs in partnership with barangay health workers to include deworming and nutrition education.",
    ],
    image: "/placeholder.svg",
  },
  {
    id: 3,
    slug: "clean-water-access-for-island-communities",
    title: "Clean Water Access for Island Communities",
    organization: "Water for All Initiative",
    category: "Water & Sanitation",
    impact: "15 communities served",
    date: "September 2024",
    excerpt:
      "Installing water filtration systems in remote island communities has reduced waterborne illnesses and improved quality of life for thousands.",
    content: [
      "Working with local fisherfolk associations, we mapped water points and trained maintenance teams.",
      "Households report fewer sick days and lower expenses on bottled water, freeing up income for school fees and livelihoods.",
      "Next up: solar-powered pumping systems to increase capacity during dry months.",
    ],
    image: "/placeholder.svg",
  },
];

export function getStoryByIdOrSlug(param: string): Story | undefined {
  const idNum = Number(param);
  if (!Number.isNaN(idNum)) {
    return stories.find((s) => s.id === idNum);
  }
  const slug = param.toLowerCase();
  return stories.find((s) => s.slug === slug);
}
