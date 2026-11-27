import assert from 'node:assert/strict';
import test from 'node:test';
import { extractCloudinaryPublicId } from '../src/utils/cloudinary';

test('extracts publicId from a versioned Cloudinary URL', () => {
  const url = 'https://res.cloudinary.com/demo/image/upload/v1690000000/forum/questions/abc123.jpg';
  assert.equal(extractCloudinaryPublicId(url), 'forum/questions/abc123');
});

test('returns empty string for non-cloudinary URLs', () => {
  assert.equal(extractCloudinaryPublicId('https://example.com/photo.png'), '');
});
