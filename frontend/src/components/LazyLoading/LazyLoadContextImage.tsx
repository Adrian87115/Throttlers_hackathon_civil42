import { useEffect, useRef, useState } from 'react';
import LoadingImageSkeleton from '../LoadingSkeletons/LoadingImageSkeleton';
import { useLazyContext } from './LazyLoadContextProvider';

export function LazyLoadContextImage({
	src,
	width,
	height,
	className
}: {
	src: string;
	width?: number | string;
	height?: number | string;
	className?: string;
}) {
	const imgRef = useRef<HTMLImageElement>(null);
	const [loaded, setLoaded] = useState(false);
	const { observe } = useLazyContext();

	useEffect(() => {
		if (!imgRef.current) return;

		observe(imgRef.current, () => setLoaded(true));
	}, []);

	return (
		<LoadingImageSkeleton
			wrapperStyles={{
				width: width + 'px',
				height: height + 'px'
			}}
			customImgComponent={
				<img
					ref={imgRef}
					width={width}
					height={height}
					src={loaded ? src : undefined}
					className={className}
					style={{
						opacity: loaded ? 1 : 0.1,
						transition: 'opacity 0.4s ease'
					}}
				/>
			}
		/>
	);
}
