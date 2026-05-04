import { User } from '@/types/user';

interface Props {
  user: User;
  onPass: (id: number) => void;
  onIgnite: (id: number) => void;
}

export default function UserCard({ user, onPass, onIgnite }: Props) {
  const sparkPct = Math.round(user.spark_score * 100);

  return (
    <div className="w-[380px] bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="relative">
        <img
          src={user.photos[0]}
          alt={user.name}
          className="w-full h-[420px] object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h2 className="text-2xl font-bold text-white">
            {user.name}, {user.age}
          </h2>
          <p className="text-orange-400 font-semibold text-sm mt-0.5">
            🔥 {sparkPct}% Spark
          </p>
        </div>
      </div>

      <div className="p-5">
        <p className="text-gray-600 text-sm italic mb-3">"{user.ai_reason}"</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {user.interests.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-orange-50 text-orange-600 border border-orange-200 rounded-full text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onPass(user.id)}
            className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            Pass
          </button>
          <button
            onClick={() => onIgnite(user.id)}
            className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:from-orange-600 hover:to-red-600 transition-all"
          >
            Ignite 🔥
          </button>
        </div>
      </div>
    </div>
  );
}
