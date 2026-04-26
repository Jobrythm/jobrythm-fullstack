interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton = ({ rows = 5, columns = 6 }: TableSkeletonProps) => {
  return (
    <div className="table-responsive placeholder-glow">
      <table className="table table-vcenter card-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, idx) => (
              <th key={`head-${idx}`}>
                <span className="placeholder col-8" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr key={`row-${row}`}>
              {Array.from({ length: columns }).map((__, col) => (
                <td key={`cell-${row}-${col}`}>
                  <span className="placeholder col-10" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

