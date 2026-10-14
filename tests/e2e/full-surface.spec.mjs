import{test,expect}from'@playwright/test';
import{readFile}from'node:fs/promises';
const contract=JSON.parse(await readFile(new URL('../../qa/product-contract.json',import.meta.url),'utf8'));
test('todas as 11 telas renderizam e expõem navegação consistente',async({page},testInfo)=>{
 await page.goto('/');
 await page.getByTestId('password').fill('Qa-Browser-2026!');
 await page.getByTestId('auth-submit').click();
 await expect(page.getByText('Frota + Manutenção Preventiva')).toBeVisible();
 for(let i=0;i<contract.screens.length;i++){
  const id=contract.screens[i],nav=page.getByTestId('nav-'+id);
  await expect(nav).toBeVisible();
  await nav.click();
  await expect(nav).toHaveClass(/on/);
  await expect(page.locator('main h1')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath(String(i+1).padStart(2,'0')+'-'+id+'.png'),fullPage:true});
 }
});
