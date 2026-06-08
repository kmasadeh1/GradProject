export default function IncidentsLoading() {
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
        <div className="flex-1 p-8">
          <div className="grid grid-cols-3 gap-6 h-full">
            {['Open', 'Investigating', 'Resolved'].map((col) => (
              <div key={col} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-50 rounded-lg border border-gray-100 animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
