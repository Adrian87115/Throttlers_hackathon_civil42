import { useTranslation } from 'react-i18next';
import { FaRegCopy } from 'react-icons/fa';
import HoverableInfo from '../HoverableInfo/HoverableInfo';

type Props = {
	copyValue: string;
	iconOnly?: boolean;
	customLabel?: string;
	iconPosition?: 'left' | 'right';
};

export default function CopyableText({
	copyValue,
	customLabel,
	iconOnly,
	iconPosition
}: Props) {
	function handleClipboardCopy(x: string) {
		navigator.clipboard.writeText(x);
	}
	const { t } = useTranslation();

	return (
		<div className="flex items-center gap-2 hoverable-info">
			{
				!iconOnly && iconPosition !== 'right' && (
					<span>{copyValue}</span>
				) /* so by default the icon will apear on the left */
			}
			<HoverableInfo
				hoverableElem={
					<FaRegCopy
						className="text-black"
						size={16}
						onClick={() => handleClipboardCopy(copyValue)}
					/>
				}
				popupLabel={customLabel ? customLabel : t('copyableText.copyDefault')}
			/>
			{!iconOnly && iconPosition === 'right' && <span>{copyValue}</span>}
		</div>
	);
}
