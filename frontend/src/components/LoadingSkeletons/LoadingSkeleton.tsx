import type { ReactNode } from 'react';
import { Skeleton } from '../ui/skeleton';

type LoadingSkeletonProps = {
	loading: boolean;
	className?: string;
	count?: number;
	children?: ReactNode;
};

const LoadingSkeleton = ({
	loading,
	count = 5,
	children
}: LoadingSkeletonProps) => {
	return (
		<div className="h-full w-full" data-testid="content-skeleton">
			{loading ? (
				<div className="flex flex-col gap-10 w-full mt-20">
					{[...Array(count)].map((_, index) => (
						<div key={index} className="flex justify-center">
							<Skeleton className="h-20 w-1/2 bg-dimmed-blue opacity-10" />
						</div>
					))}
				</div>
			) : (
				children
			)}
		</div>
	);
};

export default LoadingSkeleton;
