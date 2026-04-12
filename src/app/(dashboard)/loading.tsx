export default function DashboardLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="size-8 animate-spin rounded-full border-[3px] border-notion-blue border-t-transparent" />
        <p className="text-sm text-warm-500">Loading...</p>
      </div>
    </div>
  );
}
