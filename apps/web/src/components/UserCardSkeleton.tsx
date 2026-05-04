export default function UserCardSkeleton() {
  return (
    <div className="w-[380px] bg-white rounded-2xl shadow-xl overflow-hidden animate-pulse">
      <div className="w-full h-[420px] bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-16 bg-gray-200 rounded-full" />
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
          <div className="h-6 w-14 bg-gray-200 rounded-full" />
        </div>
        <div className="flex gap-3 pt-2">
          <div className="flex-1 h-10 bg-gray-200 rounded-xl" />
          <div className="flex-1 h-10 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
