import { error } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { RequestHandler } from './$types';

const DATA_DIR = process.env.DATA_DIR || process.cwd();
const DB_PATH = join(DATA_DIR, 'data.json');

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (!existsSync(DB_PATH)) {
		throw error(404, 'No data file found');
	}

	const data = readFileSync(DB_PATH, 'utf-8');

	return new Response(data, {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': 'attachment; filename="data.json"'
		}
	});
};
