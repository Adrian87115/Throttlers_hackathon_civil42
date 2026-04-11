import 'i18next';
import pl from '../locales/pl/translation.json';

declare module 'i18next' {
	interface CustomTypeOptions {
		resources: {
			translation: typeof pl;
		};
	}
}
