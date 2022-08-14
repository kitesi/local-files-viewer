/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ params, url }: { params: any; url: URL }) {
	return {
		headers: {
			Location: '/preview' + url.pathname
		},
		status: 302
	};
}
