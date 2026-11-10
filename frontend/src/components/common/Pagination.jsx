import Button from './Button';

const Pagination = ({ pagination, onChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total } = pagination;

  return (
    <nav aria-label="Điều hướng phân trang" className="flex items-center justify-between gap-4 pt-2">
      <p className="text-sm text-slate-500">
        Trang {page}/{totalPages} · Tổng {total} mục
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Trước
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Sau
        </Button>
      </div>
    </nav>
  );
};

export default Pagination;
