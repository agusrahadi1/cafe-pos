import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadRootDir = path.join(process.cwd(), 'uploads');
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif',
    'image/tiff',
  ];
  private readonly maxFileSizeBytes = 10 * 1024 * 1024; // 10MB input limit (will be compressed to ~30-60KB)

  // Cloudflare R2 Configuration
  private s3Client: S3Client | null = null;
  private bucketName: string = '';
  private publicUrl: string = '';
  private isR2Configured: boolean = false;

  constructor(private readonly configService: ConfigService) {
    this.initCloudflareR2();

    // Pastikan folder lokal tetap siap jika fallback dibutuhkan
    this.ensureDirectoryExists(this.uploadRootDir);
    this.ensureDirectoryExists(path.join(this.uploadRootDir, 'products'));
    this.ensureDirectoryExists(path.join(this.uploadRootDir, 'logos'));
  }

  private initCloudflareR2() {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID')?.trim();
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID')?.trim();
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY')?.trim();
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME')?.trim() || 'cafe-pos-storage';
    this.publicUrl = (
      this.configService.get<string>('R2_PUBLIC_URL')?.trim() ||
      'https://pub-a6958b635c03499499ea42790c9fa2da.r2.dev'
    ).replace(/\/$/, '');

    if (accountId && accessKeyId && secretAccessKey) {
      try {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.isR2Configured = true;
        this.logger.log(`Cloudflare R2 Object Storage successfully initialized for bucket: ${this.bucketName}`);
      } catch (err: any) {
        this.logger.error(`Failed to initialize Cloudflare R2 S3 Client: ${err.message}`);
        this.isR2Configured = false;
      }
    } else {
      this.logger.warn('Cloudflare R2 credentials not fully specified. Falling back to local storage.');
      this.isR2Configured = false;
    }
  }

  private ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Kompresi dan Simpan Gambar
   * - Otomatis resize maksimal lebar 1000px
   * - Otomatis auto-rotate berdasarkan EXIF foto kamera HP
   * - Dikonversi ke format modern WebP dengan efisiensi tinggi
   * - Diunggah langsung ke Cloudflare R2 (ukuran menjadi puluhan KB)
   */
  async saveImage(file: Express.Multer.File, targetFolder: string = 'general') {
    if (!file || !file.buffer) {
      throw new BadRequestException('File gambar tidak ditemukan');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Format file tidak didukung (${file.mimetype}). Hanya format JPG, PNG, WEBP, GIF, SVG, dan AVIF yang diperbolehkan.`,
      );
    }

    if (file.size > this.maxFileSizeBytes) {
      throw new BadRequestException('Ukuran file maksimal sebelum kompresi adalah 10MB');
    }

    // Sanitize folder name
    const safeFolder = ['products', 'logos', 'receipts'].includes(targetFolder) ? targetFolder : 'general';

    let uploadBuffer: Buffer;
    let finalMimeType = 'image/webp';
    let fileExtension = '.webp';

    // Jika file adalah SVG, tidak perlu dikompresi dengan sharp
    if (file.mimetype === 'image/svg+xml') {
      uploadBuffer = file.buffer;
      finalMimeType = 'image/svg+xml';
      fileExtension = '.svg';
    } else {
      // Kompresi gambar raster via Sharp (WebP, auto-rotate, resize max 1000px)
      try {
        uploadBuffer = await sharp(file.buffer)
          .rotate() // Menyesuaikan orientasi foto kamera HP berdasarkan tag EXIF
          .resize({
            width: 1000,
            height: 1000,
            fit: 'inside', // Proporsional, tidak merusak aspek rasio
            withoutEnlargement: true, // Jangan perbesar jika ukuran aslinya lebih kecil
          })
          .webp({
            quality: 80, // Kualitas visual sangat tajam dengan ukuran berkas minimal
            effort: 4, // Algoritma kompresi optimal
          })
          .toBuffer();
      } catch (sharpError: any) {
        this.logger.warn(`Sharp image compression failed (${sharpError.message}), using original buffer.`);
        uploadBuffer = file.buffer;
        finalMimeType = file.mimetype;
        fileExtension = path.extname(file.originalname).toLowerCase() || '.jpg';
      }
    }

    const uniqueId = uuidv4().slice(0, 8);
    const filename = `${safeFolder}-${Date.now()}-${uniqueId}${fileExtension}`;
    const compressedSize = uploadBuffer.length;
    const reductionPercent = file.size > 0 ? Math.max(0, Math.round(((file.size - compressedSize) / file.size) * 100)) : 0;

    // 1. Upload ke Cloudflare R2 jika terkonfigurasi
    if (this.isR2Configured && this.s3Client) {
      try {
        const objectKey = `${safeFolder}/${filename}`;

        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: objectKey,
            Body: uploadBuffer,
            ContentType: finalMimeType,
            CacheControl: 'public, max-age=31536000, immutable', // 1 tahun caching edge CDN
          }),
        );

        const r2Url = `${this.publicUrl}/${objectKey}`;

        this.logger.log(
          `Image successfully uploaded to R2: ${r2Url} (${Math.round(file.size / 1024)}KB -> ${Math.round(compressedSize / 1024)}KB, -${reductionPercent}%)`,
        );

        return {
          message: 'File berhasil dikompresi dan diunggah ke Cloudflare R2',
          url: r2Url,
          filename,
          originalName: file.originalname,
          originalSizeBytes: file.size,
          compressedSizeBytes: compressedSize,
          reductionPercent,
          mimetype: finalMimeType,
          storage: 'cloudflare-r2',
        };
      } catch (r2Error: any) {
        this.logger.error(`Cloudflare R2 upload error: ${r2Error.message}. Falling back to local storage.`);
      }
    }

    // 2. Fallback: Tulis berkas terkompresi ke disk lokal jika R2 sedang tidak tersedia
    const targetDir = path.join(this.uploadRootDir, safeFolder);
    this.ensureDirectoryExists(targetDir);
    const filePath = path.join(targetDir, filename);

    await fs.promises.writeFile(filePath, uploadBuffer);
    const relativeUrl = `/uploads/${safeFolder}/${filename}`;

    return {
      message: 'File berhasil dikompresi dan disimpan secara lokal',
      url: relativeUrl,
      filename,
      originalName: file.originalname,
      originalSizeBytes: file.size,
      compressedSizeBytes: compressedSize,
      reductionPercent,
      mimetype: finalMimeType,
      storage: 'local',
    };
  }
}
