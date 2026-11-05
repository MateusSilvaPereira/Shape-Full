interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  className?: string;
}

export function Skeleton({ width = "100%", height = 14, radius = 6, className }: SkeletonProps) {
  return (
    <span
      className={"skeleton " + (className ?? "")}
      style={{ width, height, borderRadius: radius }}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <Skeleton width={80} height={10} />
        <Skeleton width={31} height={31} radius={9} />
      </div>
      <Skeleton width={70} height={23} className="skeleton-block" />
      <Skeleton width={110} height={9} />
    </div>
  );
}

export function TableRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton-rows">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          <Skeleton width={34} height={34} radius={8} />
          <div className="skeleton-row-lines">
            <Skeleton width="55%" height={10} />
            <Skeleton width="35%" height={9} />
          </div>
        </div>
      ))}
    </div>
  );
}
