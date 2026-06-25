export interface CursorData {
    createdAt: string;
    id: string;
}

export const encodeCursor = (createdAt: string | Date, id: string): string => {
    const payload = JSON.stringify({ c: new Date(createdAt).toISOString(), i: id });
    return Buffer.from(payload).toString('base64');
};

export const decodeCursor = (cursor: string | undefined | null): CursorData | null => {
    if (!cursor) return null;
    try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        const { c, i } = JSON.parse(decoded);
        return { createdAt: c, id: i };
    } catch (err) {
        return null;
    }
};