const PageHeader = ({ title, description, action }) => (
  <div className="mb-6 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">{title}</h1>
      {description && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{description}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default PageHeader;
