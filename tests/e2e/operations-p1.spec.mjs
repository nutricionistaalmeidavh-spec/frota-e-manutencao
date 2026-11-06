import {test,expect} from '@playwright/test';

test('frota registra fornecedor, pneu, documento e abastecimento na mesma operação',async({page},testInfo)=>{
 await page.goto('/');
 await page.getByTestId('password').fill('p1-operacional-2026');
 await page.getByTestId('auth-submit').click();
 await page.getByTestId('nav-fleet').click();
 await page.getByRole('button',{name:'Novo veículo'}).click();
 await page.getByTestId('field-assetId').fill('CAM-E2E');
 await page.getByTestId('field-plate').fill('aaa1a11');
 await page.getByRole('button',{name:'Cadastrar veículo'}).click();
 await expect(page.locator('tbody tr')).toContainText('CAM-E2E');

 await page.getByTestId('nav-suppliers').click();
 await page.getByRole('button',{name:'Novo fornecedor'}).click();
 await page.getByTestId('field-partyId').fill('POSTO-E2E');
 await page.getByTestId('field-name').fill('Posto da Frota');
 await page.getByTestId('field-categories').fill('fuel, peças');
 await page.getByRole('button',{name:'Confirmar salvar'}).click();
 await expect(page.locator('tbody tr')).toContainText('Posto da Frota');

 await page.getByTestId('nav-documents').click();
 await page.getByRole('button',{name:'Novo documento'}).click();
 await page.getByTestId('field-id').fill('DOC-E2E');
 await page.getByRole('combobox',{name:'Veículo'}).selectOption('CAM-E2E');
 await page.getByTestId('field-type').fill('CRLV');
 await page.getByTestId('field-number').fill('2026');
 await page.getByTestId('field-expiresAt').fill('2027-12-31');
 await page.getByRole('button',{name:'Confirmar salvar'}).click();
 await expect(page.locator('tbody tr')).toContainText('DOC-E2E');

 await page.getByTestId('nav-tires').click();
 await page.getByRole('button',{name:'Novo pneu'}).click();
 await page.getByTestId('field-id').fill('TIRE-E2E');
 await page.getByTestId('field-serialNumber').fill('TP-100');
 await page.getByRole('button',{name:'Confirmar salvar'}).click();
 await expect(page.locator('tbody tr')).toContainText('TIRE-E2E');

 await page.getByTestId('nav-fuelings').click();
 await page.getByRole('button',{name:'Novo abastecimento'}).click();
 await page.getByRole('combobox',{name:'Veículo'}).selectOption('CAM-E2E');
 await page.getByTestId('field-liters').fill('30');
 await page.getByTestId('field-unitPriceMinor').fill('5');
 await page.getByTestId('field-odometer').fill('100');
 await page.getByTestId('field-occurredAt').fill('2026-11-06');
 await page.getByRole('button',{name:'Registrar abastecimento'}).click();
 await expect(page.locator('tbody tr')).toContainText('R$ 150,00');
 await page.screenshot({path:testInfo.outputPath('fleet-operations.png'),fullPage:true});
});
