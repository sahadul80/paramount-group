interface QuickActionsProps {
  onAction: (action: string) => void;
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  const actions = [
    {
      id: 'book-ride',
      title: 'Book New Ride',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: 'border-blue-500 hover:border-blue-600',
    },
    {
      id: 'travel-logs',
      title: 'View Travel History',
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'border-green-500 hover:border-green-600',
    },
    {
      id: 'profile',
      title: 'Update Profile',
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'border-purple-500 hover:border-purple-600',
    },
  ];

  return (
    <div className="rounded-2xl p-6 shadow-lg border border-slate-100">
      <h3 className="text-lg font-semibold text-accent mb-6">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className={`p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:${action.color} hover:transition-all duration-300 group text-center`}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-opacity-10 transition-colors">
              {action.icon}
            </div>
            <span className="text-sm font-medium text-accent group-hover:text-blue-600">
              {action.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}