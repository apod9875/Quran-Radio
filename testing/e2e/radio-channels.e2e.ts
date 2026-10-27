import { describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';

const CAIRO = 'إذاعة القرآن الكريم من القاهرة';
const MAKKAH = 'إذاعة القرآن الكريم من مكة المكرمة';
const HARAM = 'البث المباشر من المسجد الحرام';
const NABAWI = 'البث المباشر من المسجد النبوي';
const BAHRAIN = 'إذاعة القرآن الكريم من البحرين';

describe('radio channels tab', { tags: ['radio'] }, () => {
  test('lists the five channels under a tab right after All', async ({ app, screen }) => {
    await app.open('/#/radio');
    await expect(screen.getByRole('button', 'الإذاعات')).toBeVisible({ timeout: 15_000 });

    await screen.getByRole('button', 'الإذاعات').tap();
    for (const name of [CAIRO, MAKKAH, HARAM, NABAWI, BAHRAIN]) {
      await expect(screen.getByText(name)).toBeVisible();
    }
    await expect(screen.getByText('عرض 5 من أصل 182 إذاعة')).toBeVisible();
  });

  test('keeps the channels out of the Top Reciters tab', async ({ app, screen }) => {
    await app.open('/#/radio');
    await screen.getByRole('button', 'مشاهير القراء').tap();
    await expect(screen.getByText(CAIRO)).toHaveCount(0);
    await expect(screen.getByText(BAHRAIN)).toHaveCount(0);
  });

  test('plays the real Bahrain stream', async ({ app, screen }) => {
    await app.open('/#/radio');
    await screen.getByRole('button', 'الإذاعات').tap();
    await screen.getByText(BAHRAIN).tap();
    // The card's button turns into "pause" only once real audio is playing, so this proves the stream started
    await expect(screen.getByRole('button', 'إيقاف مؤقت').first()).toBeVisible({ timeout: 20_000 });
    await expect(screen.getByText('بث مباشر الآن').first()).toBeVisible();
  });

  test('is named in English after the language switch', async ({ app, screen }) => {
    await app.open('/#/radio');
    await screen.getByRole('button', 'Switch to English').tap();
    await expect(screen.getByRole('button', 'Radio Channels')).toBeVisible({ timeout: 15_000 });
    await screen.getByRole('button', 'Radio Channels').tap();
    await expect(screen.getByText('Holy Quran Radio from Bahrain')).toBeVisible();
  });
});
