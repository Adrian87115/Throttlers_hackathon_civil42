import { Skeleton } from '@mui/material';
import React, { useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';

type Props = {
	url?: string | undefined;
	className?: string;
	wrapperClassName?: string;
	wrapperStyles?: React.CSSProperties;
	customImgComponent?: React.ReactElement<
		React.ImgHTMLAttributes<HTMLImageElement>
	>;
};

export default function LoadingImageSkeleton({
	url,
	className,
	wrapperClassName,
	customImgComponent,
	wrapperStyles
}: Props) {
	const [isImageLoading, setIsImageLoading] = useState<boolean>(true);

	return (
		<div className={`relative ${wrapperClassName || ''}`} style={wrapperStyles}>
			{isImageLoading && (
				<Skeleton
					className={`absolute w-full h-full rounded-full no-mui-transform bg-dimmed-blue z-100`}
					animation="pulse"
				/>
			)}

			{customImgComponent ? (
				React.cloneElement(customImgComponent, {
					onLoad: (e) => {
						console.log('finished loading img');
						setIsImageLoading(false);
					},
					onError: (e) => {
						e.currentTarget.style.display = 'none';
						console.log('errored img');
						setIsImageLoading(true);
					}
				})
			) : (
				<LazyLoadImage
					src={url}
					className={`shadow-base shadow-white transition-opacity duration-300 ${
						isImageLoading ? 'opacity-0' : 'opacity-100'
					} ${className || ''}`}
					onLoad={() => setIsImageLoading(false)}
					onError={() => setIsImageLoading(true)}
				/>
			)}
		</div>
	);
}
