import express from 'express';
import multer from 'multer';
import { supabase } from '@/lib/supabaseConfig';

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // keep file in memory

app.post('/upload', upload.single('image'), async (req, res) => { // the 'image' name must match the field name in the form
  try {
    const file = req.file;
    if (!file) return res.status(400).send('No file uploaded');

    // Create a unique file name
    const fileName = `${Date.now()}-${file.originalname}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('user-profiles') // your bucket name
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from('user-profiles').getPublicUrl(fileName);

    res.status(200).json({
      message: 'Upload successful!',
      url: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading file');
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
