import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
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
	/** Renders as a non-interactive section label */
	isLabel?: boolean;
	/** Destructive style (red text) */
	destructive?: boolean;
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
	sideOffset = 8,
	modal = false
}: BaseDropdownProps) {
	const [open, setOpen] = useState(false);

	return (
		<DropdownMenu modal={modal} open={open} onOpenChange={(o) => setOpen(o)}>
			<DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

			<DropdownMenuContent
				sideOffset={sideOffset}
				align="end"
				className={cn(
					'z-[400] min-w-[200px] rounded-xl border border-base-border bg-white shadow-base-tile',
					contentClassName
				)}>
				{items.map((item, i) => {
					if (item.separator) {
						return (
							<DropdownMenuSeparator
								key={`sep-${i}`}
								className="my-1.5 bg-base-border"
							/>
						);
					}

					if (item.isLabel || item.className?.includes('pointer-events-none')) {
						return (
							<DropdownMenuLabel
								key={`label-${i}`}
								className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-base-muted-foreground">
								{item.label}
							</DropdownMenuLabel>
						);
					}

					return (
						<DropdownMenuItem
							key={i}
							className={cn(
								'cursor-pointer rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors',
								'focus:bg-dimmed-blue/15 focus:text-primary-blue',
								item.destructive &&
									'text-red-500 focus:bg-red-50 focus:text-red-600',
								item.className
							)}
							onClick={() => {
								if (item.onClick) item.onClick();
								setOpen(false);
							}}>
							{item.icon && (
								<span className="mr-2.5 flex items-center text-base-muted-foreground">
									{item.icon}
								</span>
							)}
							{item.label}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
