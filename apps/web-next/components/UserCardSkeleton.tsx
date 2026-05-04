export default function UserCardSkeleton() {
  return (
    <div className="w-[400px] bg-white rounded-2xl shadow-xl overflow-hidden animate-pulse">
      {/* Photo placeholder */}
      <div className="h-[500px] bg-gray-200" />
      {/* Content */}
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded-full w-full" />
          <div className="h-3 bg-gray-200 rounded-full w-4/5" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-14 bg-gray-200 rounded-full" />
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
          <div className="h-6 w-12 bg-gray-200 rounded-full" />
          <div className="h-6 w-16 bg-gray-200 rounded-full" />
        </div>
        <div className="flex gap-3 pt-1">
          <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
          <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
