import { MasivoComponent } from './masivo.component';

describe('MasivoComponent', () => {
  it('debe extraer RUCs válidos de un texto', () => {
    const texto = '20123456789\n20456789012\n999\nABC\n20111111111';
    const rucs = MasivoComponent.extraerRucsDesdeTexto(texto);

    expect(rucs).toEqual(['20123456789', '20456789012', '20111111111']);
  });
});
