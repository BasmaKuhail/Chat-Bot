import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { message } = req.body;

    // mock AI response
    const fakeResponse = `You said: ${message}`;

    res.status(200).json({
        reply: fakeResponse,
    });
}