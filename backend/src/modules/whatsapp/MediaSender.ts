import { Client, MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';

export class MediaSender {
  /**
   * Sends media to a WhatsApp number. 
   * Fetches URL if it's an HTTP link, otherwise treats as a local path.
   */
  static async sendMedia(client: Client, to: string, url: string, caption?: string, filename?: string): Promise<void> {
    try {
      let media: MessageMedia;

      if (url.startsWith('http')) {
        const response = await axios.get(url, { 
          responseType: 'arraybuffer',
          timeout: 10000,
          headers: { 'User-Agent': 'KLB-Chat-Bot/1.0' }
        });
        
        const buffer = Buffer.from(response.data);
        const base64 = buffer.toString('base64');
        
        // Infer mimetype from URL or fallback
        const mimeType = this.inferMimeType(url);
        
        media = new MessageMedia(mimeType, base64, filename || 'document');
      } else {
        // Local file path
        media = MessageMedia.fromFilePath(url);
      }

      await client.sendMessage(to, media, { caption });
    } catch (error) {
      console.error(`[MediaSender] Failed to send media to ${to}:`, error);
      // Fallback: Send just the caption and URL if media fails
      if (caption || url) {
        await client.sendMessage(to, `${caption ? caption + '\n\n' : ''}🔗 Media Link: ${url}`);
      }
    }
  }

  private static inferMimeType(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'mp4': return 'video/mp4';
      case 'csv': return 'text/csv';
      default: return 'application/octet-stream';
    }
  }
}
