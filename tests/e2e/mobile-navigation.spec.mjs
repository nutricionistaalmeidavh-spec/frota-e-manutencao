import {test,expect} from '@playwright/test';
test('a interface no celular permite navegacao',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.getByTestId('password').fill('teste-mobile-2026');
 await page.getByTestId('auth-submit').click();
 await page.getByRole('button',{name:'Abrir navegação'}).click();
 await expect(page.getByTestId('nav-fleet')).toBeVisible();
});