import React, { memo, useMemo } from 'react';
import Radar from './Radar';

type RadarProps = React.ComponentProps<typeof Radar>;

const MemoizedRadar = memo(({ radarProps, radarClassName }: { radarProps?: RadarProps; radarClassName?: string }) => (
	<div className={`absolute inset-0 h-full w-full -z-10 pointer-events-none ${radarClassName ?? ''}`}>
		<Radar
			speed={1}
			scale={0.5}
			ringCount={10}
			spokeCount={10}
			ringThickness={0.05}
			spokeThickness={0.01}
			sweepSpeed={1}
			sweepWidth={2}
			sweepLobes={1}
			color="#de3b3b"
			backgroundColor="#852323"
			falloff={2}
			brightness={1}
			enableMouseInteraction={false}
			{...radarProps}
		/>
	</div>
));

type Props = {
	className?: string;
	radarClassName?: string;
	radarProps?: RadarProps;
	children: React.ReactNode;
};

export default function RadarRender({
	className,
	radarClassName,
	radarProps,
	children
}: Props) {
	const memoizedProps = useMemo(() => radarProps, []);

	return (
		<div className={`relative isolate overflow-hidden ${className ?? ''}`}>
			<MemoizedRadar radarProps={memoizedProps} radarClassName={radarClassName} />
			<div className="relative z-10">{children}</div>
		</div>
	);
}
