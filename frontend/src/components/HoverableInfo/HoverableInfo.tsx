import {
	autoUpdate,
	flip,
	offset,
	shift,
	useFloating
} from '@floating-ui/react';
import { Info } from 'lucide-react';
import React from 'react';

type Props = {
	hoverableElem: React.JSX.Element;
	popupLabel: string;
	infoIcon?: boolean;
	className?: string;
	popupLabelClassName?: string;
	baseElemsClassName?: string;
};

export default function HoverableInfo({
	hoverableElem,
	popupLabel,
	infoIcon,
	className,
	baseElemsClassName,
	popupLabelClassName
}: Props) {
	const { refs, floatingStyles } = useFloating({
		placement: 'top', // default position
		middleware: [
			offset(6), // space between elem and label
			flip(), // if it doesn't fit → flip to bottom
			shift({ padding: 5 }) // keep within viewport horizontally
		],
		whileElementsMounted: autoUpdate
	});

	return (
		<div
			ref={refs.setReference}
			className={`hoverable-info cursor-pointer relative flex items-center gap-2 w-fit ${
				className || ''
			}`}>
			<div className={`${baseElemsClassName || ''} w-full`}>
				{hoverableElem}
			</div>

			<label
				ref={refs.setFloating}
				style={floatingStyles}
				className={`popup-label ${popupLabelClassName || ''}`}>
				{popupLabel}
			</label>

			{infoIcon && (
				<Info
					size={18}
					className={`${baseElemsClassName || ''} min-w-[18px]`}
				/>
			)}
		</div>
	);
}
