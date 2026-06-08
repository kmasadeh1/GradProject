export default function DashboardLoading() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* Sidebar skeleton */}
      <div className="w-64 bg-gray-900 flex flex-col flex-shrink-0">
        <div className="h-16 px-6 flex items-center border-b border-gray-700">
          <div className="h-5 w-36 bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="flex-1 px-2 py-4 space-y-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-700/40 rounded-md animate-pulse" />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 bg-white shadow-sm flex items-center px-8 gap-4">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="ml-auto h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="flex-1 p-8 space-y-6">
          <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-72 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse" />
            <div className="h-72 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
