import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('STE UI ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/app';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="card-bento max-w-md w-full p-8 text-center bg-white shadow-xl border border-slate-200">
            <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto mb-4 border border-rose-100">
              ⚠️
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Đã xảy ra sự cố hiển thị
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
              Trang vừa gặp một lỗi bất ngờ khi nạp dữ liệu. Vui lòng bấm thử lại hoặc quay lại trang chủ.
            </p>
            {this.state.error && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-left overflow-auto max-h-32 text-[11px] font-mono text-rose-600">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
              >
                Tải lại trang
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

