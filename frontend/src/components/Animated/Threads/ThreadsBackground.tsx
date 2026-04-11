import React, { memo, useMemo } from 'react';
import Threads, { ThreadsProps } from './Threads';

const MemoizedThreads = memo(
	({ threadsProps }: { threadsProps?: ThreadsProps }) => (
		<div className="absolute inset-0 viewport-height-no-header opacity-20 h-full w-full -z-10 pointer-events-none">
			<Threads
				color={[0.14, 0.36, 1.0]}
				amplitude={1}
				distance={0}
				enableMouseInteraction={false}
				{...threadsProps}
			/>
		</div>
	)
);

type Props = {
	children: React.ReactNode;
	className?: string;
	threadsProps?: ThreadsProps;
};

export default function ThreadsBackground({
	children,
	className,
	threadsProps
}: Props) {
	const memoizedProps = useMemo(() => threadsProps, []);

	return (
		<div className={`relative isolate ${className ?? ''}`}>
			<MemoizedThreads threadsProps={memoizedProps} />
			<div className={`relative z-10 `}>{children}</div>
		</div>
	);
}
