import { User } from '@/types/user';

export async function getDiscoverUsers(): Promise<User[]> {
  await new Promise((r) => setTimeout(r, 600));

  return [
    {
      id: 1,
      name: 'Alex Chen',
      age: 26,
      photos: ['https://picsum.photos/seed/alex/400/500'],
      interests: ['AI', 'Startups', 'Tech'],
      spark_score: 0.87,
      ai_reason: 'You both love building things and AI',
    },
    {
      id: 2,
      name: 'Jordan Rivera',
      age: 29,
      photos: ['https://picsum.photos/seed/jordan/400/500'],
      interests: ['Design', 'Photography', 'Travel'],
      spark_score: 0.74,
      ai_reason: 'Shared passion for visual storytelling and adventure',
    },
    {
      id: 3,
      name: 'Sam Patel',
      age: 24,
      photos: ['https://picsum.photos/seed/sam/400/500'],
      interests: ['Music', 'Coffee', 'Gaming'],
      spark_score: 0.91,
      ai_reason: 'Your taste in indie music and late-night energy aligns perfectly',
    },
  ];
}
