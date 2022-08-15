/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ url }: { url: URL }) {
	return {
		headers: {
			Location: '/preview' + url.pathname
		},
		status: 302
	};
}
