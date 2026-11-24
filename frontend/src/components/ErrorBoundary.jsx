import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-6 shadow-lg text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Se produjo un inconveniente en la vista</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ocurrió un error al cargar los componentes pedagógicos. Puedes recuperar la pantalla haciendo clic abajo.
            </p>
            {this.state.error?.message && (
              <div className="text-[11px] font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-rose-800 text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar Vista Institucional
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
