import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from './cloudinary.service';
import {
  v2 as cloudinary,
  UploadApiOptions,
  UploadApiResponse,
} from 'cloudinary';
import { Readable } from 'stream';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    // Reset env vars and mocks
    process.env.CLOUDINARY_CLOUD_NAME = 'test_cloud';
    process.env.CLOUDINARY_API_KEY = 'test_key';
    process.env.CLOUDINARY_API_SECRET = 'test_secret';
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudinaryService],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize cloudinary config', () => {
    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'test_cloud',
      api_key: 'test_key',
      api_secret: 'test_secret',
      secure: true,
    });
  });

  it('should successfully upload an image via buffer', async () => {
    const fakeBuffer = Buffer.from('fake image data');
    const fakeResult = {
      secure_url: 'http://test.com/img.jpg',
      public_id: 'img123',
      width: 100,
      height: 100,
      format: 'jpg',
      url: 'http://test.com/img.jpg',
    } as UploadApiResponse;

    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (
        options: UploadApiOptions,
        callback: (
          error: Error | null,
          result: UploadApiResponse | undefined,
        ) => void,
      ) => {
        callback(null, fakeResult);
        return new Readable({
          read() {},
        });
      },
    );

    const result = await service.uploadImage(fakeBuffer, 'test_folder');
    expect(result).toEqual({
      secureUrl: 'http://test.com/img.jpg',
      publicId: 'img123',
      width: 100,
      height: 100,
      format: 'jpg',
      url: 'http://test.com/img.jpg',
    });
  });

  it('should handle upload failure', async () => {
    const fakeBuffer = Buffer.from('fake image data');

    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (
        options: UploadApiOptions,
        callback: (
          error: Error | null,
          result: UploadApiResponse | undefined,
        ) => void,
      ) => {
        callback(new Error('Cloudinary error'), undefined);
        return new Readable({
          read() {},
        });
      },
    );

    await expect(
      service.uploadImage(fakeBuffer, 'test_folder'),
    ).rejects.toThrow('Cloudinary error');
  });
});
