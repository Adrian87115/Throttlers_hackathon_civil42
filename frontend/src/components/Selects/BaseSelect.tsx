import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';

export interface BaseSelectOption {
	label: string;
	value: string;
}

interface BaseSelectProps {
	options: BaseSelectOption[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	label?: string;
	className?: string;
}

export function BaseSelect({
	options,
	value,
	onChange,
	placeholder,
	label,
	className
}: BaseSelectProps) {
	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger
				className={`w-fit bg-bg-primary-dark cursor-pointer border-dimmed-blue! focus-visible:ring-0 text-white border rounded-md shadow-base shadow-primary-blue ${
					className || ''
				}`}>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>

			<SelectContent className="bg-bg-primary-dark text-white border border-gray-600 rounded-md shadow-lg">
				<SelectGroup className="">
					{label && (
						<SelectLabel className="text-gray-400">{label}</SelectLabel>
					)}
					{options.map((opt) => (
						<SelectItem
							key={opt.value}
							value={opt.value}
							className="text-white! hover:bg-dimmed-blue/60! transition-colors duration-300 bg-transparent! rounded-md px-2 py-1">
							{opt.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
