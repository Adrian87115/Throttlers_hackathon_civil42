import { createContext, useContext, useEffect, useRef } from 'react';

type LazyContextType = {
	observe: (el: HTMLElement, cb: () => void) => void;
};

const LazyContext = createContext<LazyContextType | null>(null);

export function LazyLoadContextProvider({
	rootRef,
	children
}: {
	rootRef: React.RefObject<HTMLElement | null>;
	children: React.ReactNode;
}) {
	const observerRef = useRef<IntersectionObserver | null>(null);

	useEffect(() => {
		if (!rootRef.current) return;

		observerRef.current = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const cb = (entry.target as any).__lazy_cb;
						cb?.();
						observerRef.current?.unobserve(entry.target);
					}
				}
			},
			{
				root: rootRef.current,
				threshold: 0.2
			}
		);

		return () => observerRef.current?.disconnect();
	}, [rootRef]);

	const observe = (el: HTMLElement, cb: () => void) => {
		(el as any).__lazy_cb = cb;
		observerRef.current?.observe(el);
	};

	return (
		<LazyContext.Provider value={{ observe }}>{children}</LazyContext.Provider>
	);
}

export function useLazyContext() {
	const ctx = useContext(LazyContext);
	if (!ctx) throw new Error('LazyLoadContextImage must be inside provider');
	return ctx;
}
