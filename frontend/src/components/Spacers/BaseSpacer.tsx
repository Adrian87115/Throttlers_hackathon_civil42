type Props = {
	height?: number;
	backgroundColor?: string;
	shadowClass?: string;
	shadowColor?: string;
	className?: string;
};

export default function BaseSpacer({
	height,
	backgroundColor,
	shadowClass,
	shadowColor,
	className
}: Props) {
	return (
		<div
			style={{ height: height ? `${height}px` : '1px' }}
			className={`w-full rounded-full ${backgroundColor || 'bg-dimmed-blue'} ${
				shadowClass || 'shadow-base'
			} ${shadowColor || 'shadow-primary-blue'} ${className || ''}`}
		/>
	);
}
