import ReloadSpinner from '@/app/components/ReloadSpinner';

type LoadingStateProps = {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export default function LoadingState({
  message,
  fullScreen = false,
  size = 'md',
  className = '',
}: LoadingStateProps) {
  const content = (
    <div className={`flex flex-col items-center gap-4 text-center ${className}`}>
      <ReloadSpinner size={size} label={message ?? 'Chargement'} />
      {message && (
        <p className="max-w-xs text-xs text-slate-400 sm:text-sm">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center px-4 py-16">
        {content}
      </div>
    );
  }

  return content;
}
