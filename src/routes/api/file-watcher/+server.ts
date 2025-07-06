import type { RequestHandler } from '@sveltejs/kit';

// Store connected SSE clients
const clients = new Set<ReadableStreamDefaultController>();

export function _notifyFileChanged() {
	// Send file change notification to all connected clients
	clients.forEach((controller) => {
		try {
			controller.enqueue(
				`data: ${JSON.stringify({ type: 'file-changed' })}\n\n`
			);
		} catch (error) {
			// Client disconnected, remove from set
			clients.delete(controller);
		}
	});
}

export const GET: RequestHandler = async function ({ setHeaders }) {
	setHeaders({
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		Connection: 'keep-alive',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Cache-Control'
	});

	const stream = new ReadableStream({
		start(controller) {
			// Send initial connection message
			controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

			// Add client to the set
			clients.add(controller);

			// Keep the connection alive with periodic pings
			const pingInterval = setInterval(() => {
				try {
					controller.enqueue(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
				} catch (error) {
					// Client disconnected
					clearInterval(pingInterval);
					clients.delete(controller);
				}
			}, 30000); // Ping every 30 seconds

			// Clean up on close
			return () => {
				clearInterval(pingInterval);
				clients.delete(controller);
			};
		}
	});

	return new Response(stream);
};
