import { createTheme } from '@mui/material';

declare module '@mui/material/styles' {
	interface Palette {
		primaryBlue: Palette['primary'];
		primaryRed: Palette['primary'];
	}

	interface PaletteOptions {
		primaryBlue?: PaletteOptions['primary'];
		primaryRed?: PaletteOptions['primary'];
	}
}

declare module '@mui/material/TextField' {
	interface TextFieldPropsColorOverrides {
		primaryBlue: true;
		primaryRed: true;
	}
}
declare module '@mui/material/FormControl' {
	interface FormControlPropsColorOverrides {
		primaryRed: true;
		primaryBlue: true;
	}
}
declare module '@mui/material/FormControlLabel' {
	interface FormControlLabelPropsColorOverrides {
		primaryRed: true;
		primaryBlue: true;
	}
}

declare module '@mui/material/Checkbox' {
	interface CheckboxPropsColorOverrides {
		primaryRed: true;
		primaryBlue: true;
	}
}

declare module '@mui/material/Button' {
	interface ButtonPropsColorOverrides {
		primaryRed: true;
		primaryBlue: true;
	}
}

declare module '@mui/material/IconButton' {
	interface IconButtonPropsColorOverrides {
		primaryRed: true;
		primaryBlue: true;
	}
}

declare module '@mui/material/Switch' {
	interface SwitchPropsColorOverrides {
		primaryRed: true;
		primaryBlue: true;
	}
}

declare module '@mui/material/Radio' {
	interface RadioPropsColorOverrides {
		primaryRed: true;
		primaryBlue: true;
	}
}

export const primaryBlueTheme = createTheme({
	palette: {
		primaryBlue: {
			main: '#A1CEEF',
			dark: '#6BA6D9',
			light: '#D2E9FA',
			contrastText: '#0A1A2F'
		}
	}
});

export const primaryRedTheme = createTheme({
	palette: {
		primaryRed: {
			main: '#dc2626', // tailwind red-600
			dark: '#991b1b', // tailwind red-800
			light: '#ef4444', // tailwind red-500
			contrastText: '#fff'
		}
	},
	typography: {
		fontFamily: 'Lato, sans-serif'
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					'&.Mui-disabled': {
						backgroundColor: '#dc2626 !important',
						color: '#fff !important'
					}
				}
			}
		},
		MuiCheckbox: {
			styleOverrides: {
				root: {
					color: '#dc2626', // unchecked color
					'&.Mui-checked': {
						color: '#dc2626' // checked color
					},
					'&.MuiCheckbox-root:hover': {
						backgroundColor: 'rgba(220, 38, 38, 0.08)' // custom hover
					}
				}
			}
		},
		MuiRadio: {
			styleOverrides: {
				root: {
					color: '#dc2626',
					'&.Mui-checked': {
						color: '#dc2626'
					}
				}
			}
		}
	}
});
