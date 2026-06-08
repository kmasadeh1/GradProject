export default function RisksLoading() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
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
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 bg-white shadow-sm flex items-center px-8">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex-1 p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 w-32 bg-blue-200 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-full bg-white border border-gray-200 rounded-xl animate-pulse" />
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-12 bg-gray-50 border-b border-gray-100 animate-pulse" />
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 border-b border-gray-50 px-6 flex items-center gap-4 animate-pulse">
                <div className="h-4 flex-1 bg-gray-100 rounded" />
                <div className="h-4 w-20 bg-gray-100 rounded" />
                <div className="h-6 w-16 bg-gray-100 rounded-full" />
                <div className="h-4 w-12 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
