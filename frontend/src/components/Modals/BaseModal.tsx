import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog';
import React, { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import BaseButton from '../Buttons/BaseButton';

type Props = {
	title: string;
	description: string;
	onDialogSubmit?: () => void;
	onDialogClose?: () => void;
	additionalBody?: React.JSX.Element;
	buttonContinueCustomText?: string;
	buttonContinueDisabled?: boolean;
	className?: string;
	cancelButton?: boolean;
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	buttonContinueClassName?: string;
};

export function BaseModal({
	title,
	description,
	additionalBody,
	onDialogSubmit,
	onDialogClose,
	className,
	buttonContinueCustomText,
	buttonContinueDisabled,
	cancelButton,
	isOpen,
	setIsOpen,
	buttonContinueClassName
}: Props) {
	const { t } = useTranslation();

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				setIsOpen(open);
				if (!open && onDialogClose) {
					onDialogClose();
				}
			}}>
			<DialogContent
				className={`max-w-[90vw]! max-h-[60vh] overflow-y-auto sm:min-w-0 min-w-[90%] w-fit bg-bg-darker shadow-base shadow-dimmed-blue border-dimmed-blue ${
					className || ''
				}`}>
				<DialogHeader>
					<DialogTitle className="text-white">{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{additionalBody}
				<DialogFooter className="mt-5">
					{cancelButton && (
						<DialogClose asChild>
							<BaseButton className="mr-auto border-gray-500! text-gray-400!">
								{t('shared.cancel')}
							</BaseButton>
						</DialogClose>
					)}
					{
						<DialogClose asChild>
							<BaseButton
								type="submit"
								disabled={buttonContinueDisabled}
								className={`${buttonContinueClassName || ''}`}
								onClick={() => {
									if (onDialogSubmit) {
										onDialogSubmit();
									}
								}}>
								{buttonContinueCustomText
									? buttonContinueCustomText
									: t('shared.continue')}
							</BaseButton>
						</DialogClose>
					}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
