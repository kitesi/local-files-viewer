/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				'blue-1': '#009eff',
				'blue-2': '#6db0da',
				'black-1': '#161a20',
				'black-2': '#1e2328',
				'black-3': '#1a1f24',
				'black-4': '#1a1f24',
				'black-5': '#0e0f11',
				'red-1': '#ce2727',
				'yellow-1': '#fff5bc',
				'green-1': '#c3fab9'
			},
			fontFamily: {
				roboto: ['Roboto', 'Arial', 'sans-serif']
			},
			transitionDuration: {
				2000: '2000ms'
			}
		}
	},
	plugins: []
};
