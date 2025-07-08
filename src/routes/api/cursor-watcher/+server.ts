import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

// Store connected SSE clients
const cursorClients = new Set<ReadableStreamDefaultController>();

// Store cursor positions per file
const cursorPositions = new Map<string, { line: number }>();

function notifyCursorChanged(file: string, line: number) {
	// Update cursor position for this file
	cursorPositions.set(file, { line });

	// Send cursor change notification to all connected clients
	cursorClients.forEach((controller) => {
		try {
			controller.enqueue(
				`data: ${JSON.stringify({
					type: 'cursor-changed',
					file,
					line
				})}\n\n`
			);
		} catch (error) {
			// Client disconnected, remove from set
			cursorClients.delete(controller);
		}
	});
}

export const POST: RequestHandler = async function ({ request }) {
	const { file, line } = await request.json();

	if (!file || typeof line !== 'number') {
		return json({ error: 'Invalid parameters' }, { status: 400 });
	}

	notifyCursorChanged(file, line);
	return json({ success: true });
};

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
			cursorClients.add(controller);

			// Keep the connection alive with periodic pings
			const pingInterval = setInterval(() => {
				try {
					controller.enqueue(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
				} catch (error) {
					// Client disconnected
					clearInterval(pingInterval);
					cursorClients.delete(controller);
				}
			}, 30000); // Ping every 30 seconds

			// Clean up on close
			return () => {
				clearInterval(pingInterval);
				cursorClients.delete(controller);
			};
		}
	});

	return new Response(stream);
};
