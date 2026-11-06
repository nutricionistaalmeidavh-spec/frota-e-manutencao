import {test,expect} from '@playwright/test';

test('usuário cadastra motorista e frete, despacha com veículo existente e registra despesa',async({page})=>{
 await page.goto('/');
 await page.getByTestId('password').fill('fretes-e2e-2026');
 await page.getByTestId('auth-submit').click();
 await page.getByTestId('nav-fleet').click();
 await page.getByRole('button',{name:'Novo veículo'}).click();
 await page.getByTestId('field-assetId').fill('CAM-E2E');
 await page.getByTestId('field-plate').fill('abc1d23');
 await page.getByTestId('field-odometer').fill('1000');
 await page.getByRole('button',{name:'Cadastrar veículo'}).click();
 await expect(page.locator('tbody tr')).toContainText('CAM-E2E');

 await page.getByTestId('nav-drivers').click();
 await page.getByRole('button',{name:'Novo motorista'}).click();
 await page.getByTestId('field-partyId').fill('MOT-E2E');
 await page.getByTestId('field-licenseNumber').fill('123456');
 await page.getByTestId('field-licenseExpiresAt').fill('2028-12-31');
 await page.getByRole('button',{name:'Confirmar salvar'}).click();
 await expect(page.locator('tbody tr')).toContainText('MOT-E2E');

 await page.getByTestId('nav-freights').click();
 await page.getByRole('button',{name:'Novo frete'}).click();
 await page.getByTestId('field-customerPartyId').fill('CLI-E2E');
 await page.getByTestId('field-origin').fill('Ribeirão Preto');
 await page.getByTestId('field-destination').fill('Uberaba');
 await page.getByRole('textbox',{name:'Descrição da carga'}).fill('Peças automotivas');
 await page.getByTestId('field-priceMinor').fill('500');
 await page.getByRole('button',{name:'Criar frete'}).click();
 await expect(page.locator('tbody tr')).toContainText('Ribeirão Preto');

 await page.locator('tbody tr').first().getByRole('button',{name:/Ver detalhes/}).click();
 await page.getByRole('button',{name:'Iniciar viagem'}).click();
 await page.getByRole('combobox',{name:'Veículo da frota'}).selectOption('CAM-E2E');
 await page.getByRole('combobox',{name:'Motorista cadastrado'}).selectOption('MOT-E2E');
 await page.getByTestId('field-odometerStart').fill('1000');
 await page.getByRole('button',{name:'Confirmar iniciar viagem'}).click();
 await expect(page.locator('tbody tr')).toContainText('Em viagem');

 await page.locator('tbody tr').first().getByRole('button',{name:/Ver detalhes/}).click();
 await page.getByRole('button',{name:'Despesa da viagem'}).click();
 await page.getByTestId('field-description').fill('Pedágio');
 await page.getByTestId('field-amountMinor').fill('50');
 await page.getByRole('button',{name:'Confirmar despesa da viagem'}).click();
 await expect(page.locator('tbody tr')).toContainText('R$ 50,00');
});
