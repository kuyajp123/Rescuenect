import { Request, Response } from "express";

export const imageProxy = async (req: Request, res: Response) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
        return res.status(400).send("Image URL is required");
    }
    
    try {
        const response = await fetch(imageUrl);
        const contentType = response.headers.get('content-type');
        const buffer = await response.arrayBuffer();
    
        res.setHeader('Content-Type', contentType || 'image/jpeg');
        res.send(Buffer.from(buffer));
      } catch (error) {
        console.error('Error proxying image:', error);
        res.status(500).send('Failed to fetch image');
      }

}

export default imageProxy;