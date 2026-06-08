export default function AssessmentsLoading() {
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
          <div className="h-5 w-44 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex-1 p-8 space-y-4 max-w-3xl">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="flex gap-4">
                  <div className="h-9 w-20 bg-gray-100 rounded-lg" />
                  <div className="h-9 w-20 bg-gray-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
