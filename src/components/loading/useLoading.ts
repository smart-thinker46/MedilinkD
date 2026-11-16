import { useLoadingContext } from './LoadingContext';

/**
 * Hook to control a named loader.
 * Usage: const loader = useLoading('myOp'); loader.start(); … loader.stop();
 */
export const useLoading = (id: string) => {
  const { show, hide } = useLoadingContext();
  return {
    start: () => show(id),
    stop: () => hide(id),
  };
};
