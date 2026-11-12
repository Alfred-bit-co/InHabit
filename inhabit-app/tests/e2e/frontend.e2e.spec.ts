import { test, expect } from '@playwright/test'

test.describe('Site public', () => {
  test('affiche l’accueil et la navigation', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/InHabit/)
    await expect(page.locator('h1').first()).toContainText('Architecture')
    for (const label of ['Accueil', 'YouTube', 'Produits', 'Projets', 'À propos']) {
      await expect(page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: label })).toBeVisible()
    }
  })
})
