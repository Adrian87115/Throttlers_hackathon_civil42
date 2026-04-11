import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pl from '../locales/pl/translation.json';

i18n.use(initReactI18next).init({
	fallbackLng: 'pl',
	debug: false,
	resources: {
		pl: {
			translation: pl
		}
	},
	pluralSeparator: '_'
});

export default i18n;
