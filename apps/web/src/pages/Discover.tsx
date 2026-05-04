import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDiscoverUsers } from '@/lib/mockApi';
import { User } from '@/types/user';
import Navbar from '@/components/Navbar';
import UserCard from '@/components/UserCard';
import UserCardSkeleton from '@/components/UserCardSkeleton';

export default function Discover() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [ignited, setIgnited] = useState<number[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    getDiscoverUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [navigate]);

  const handlePass = (id: number) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleIgnite = (id: number) => {
    setIgnited((prev) => [...prev, id]);
    setTimeout(() => setUsers((prev) => prev.filter((u) => u.id !== id)), 600);
  };

  const currentUser = users[0] ?? null;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />

      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] px-4 py-8">
        {loading ? (
          <UserCardSkeleton />
        ) : currentUser ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-400 font-medium">
              {users.length} {users.length === 1 ? 'person' : 'people'} left in your queue
            </p>
            <div
              key={currentUser.id}
              className={`transition-all duration-500 ${
                ignited.includes(currentUser.id) ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
              }`}
            >
              <UserCard
                user={currentUser}
                onPass={handlePass}
                onIgnite={handleIgnite}
              />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-5xl mb-4">🔥</p>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">You're all caught up!</h2>
            <p className="text-gray-500">Check back later for new matches.</p>
          </div>
        )}
      </main>
    </div>
  );
}
