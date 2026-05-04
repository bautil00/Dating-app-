import { User } from "@/types/user";

export async function getDiscoverUsers(): Promise<User[]> {
  await new Promise((r) => setTimeout(r, 500));

  return [
    {
      id: 1,
      name: "Alex Chen",
      age: 26,
      photos: ["https://picsum.photos/seed/alex/500/640"],
      interests: ["AI", "Startups", "Tech", "Music"],
      spark_score: 0.87,
      ai_reason: "You both love AI, startups, and building impactful products",
    },
    {
      id: 2,
      name: "Jordan Rivera",
      age: 29,
      photos: ["https://picsum.photos/seed/jordan/500/640"],
      interests: ["Design", "Photography", "Travel", "Coffee"],
      spark_score: 0.74,
      ai_reason: "Shared passion for visual storytelling and creative exploration",
    },
    {
      id: 3,
      name: "Sam Patel",
      age: 24,
      photos: ["https://picsum.photos/seed/sam/500/640"],
      interests: ["Music", "Gaming", "Fitness", "Tech"],
      spark_score: 0.91,
      ai_reason: "Your energy, taste in music, and ambition sync up perfectly",
    },
    {
      id: 4,
      name: "Morgan Lee",
      age: 27,
      photos: ["https://picsum.photos/seed/morgan/500/640"],
      interests: ["Books", "Hiking", "Art", "Cooking"],
      spark_score: 0.68,
      ai_reason: "You both value depth, nature, and creative expression",
    },
  ];
}
