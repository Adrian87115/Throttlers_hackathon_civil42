import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';

type DropdownItem = {
	label?: React.ReactNode;
	icon?: React.ReactNode;
	onClick?: () => void;
	separator?: boolean;
	className?: string;
};

type BaseDropdownProps = {
	trigger: React.ReactNode;
	items: DropdownItem[];
	contentClassName?: string;
	sideOffset?: number;
	modal?: boolean;
};

export function BaseDropdown({
	trigger,
	items,
	contentClassName,
	sideOffset = 5,
	modal = false
}: BaseDropdownProps) {
	const [open, setOpen] = useState(false);

	return (
		<DropdownMenu modal={modal} open={open} onOpenChange={(o) => setOpen(o)}>
			<DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

			<DropdownMenuContent
				sideOffset={sideOffset}
				className={cn(
					'z-[400] bg-bg-primary-dark shadow-base shadow-dimmed-blue border-gray-500 text-white',
					'w-fit',
					contentClassName
				)}>
				{items.map((item, i) =>
					item.separator ? (
						<DropdownMenuSeparator
							key={`sep-${i}`}
							className="bg-primary-blue"
						/>
					) : (
						<DropdownMenuItem
							key={i}
							className={cn('dropdown-item smaller', item.className)}
							onClick={() => {
								if (item.onClick) item.onClick();
								setOpen(false);
							}}>
							{item.icon && <span className="mr-2">{item.icon}</span>}
							{item.label}
						</DropdownMenuItem>
					)
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
