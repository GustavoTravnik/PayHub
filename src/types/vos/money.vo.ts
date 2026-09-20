export class MoneyVO {
  constructor(private readonly cents: number) {}

  get value(): number {
    return this.cents;
  }

  get formatted(): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(this.cents / 100);
  }

  get inReais(): number {
    return this.cents / 100;
  }

  static fromReais(reais: number): MoneyVO {
    return new MoneyVO(Math.round(reais * 100));
  }
}
