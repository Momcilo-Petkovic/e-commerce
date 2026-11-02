export default function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 grid size-16 place-items-center rounded-full bg-teal-50 text-teal-600">
          <Icon className="size-8" />
        </span>
      )}
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      {children && <div className="mt-2 max-w-md text-slate-600">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card mx-auto my-10 max-w-lg p-8 text-center">
      <h2 className="text-lg font-bold text-slate-900">We couldn't load this page</h2>
      <p className="mt-2 text-slate-600">{error?.message || 'Something went wrong.'}</p>
      {onRetry && (
        <button className="btn-secondary mt-5" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
