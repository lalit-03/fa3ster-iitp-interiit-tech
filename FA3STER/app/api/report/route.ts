import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET() {
    try {
        // Construct the absolute path to the JSON file
        const filePath = path.join(process.cwd(), 'backend_server', 'report_dashboard.json');
        const fileData = await fs.readFile(filePath, 'utf8'); // Read the file content

        // Parse the file and send the response as JSON
        return NextResponse.json(JSON.parse(fileData));
    } catch (error) {
        console.error('Error reading the file:', error);
        return NextResponse.json({ error: 'File not found or could not be read' }, { status: 404 });
    }
}
