export class DocumentVO {
  constructor(private readonly value: string) {}

  get clean(): string {
    return this.value.replace(/\D/g, "");
  }

  get formatted(): string {
    const clean = this.clean;
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return this.value;
  }

  get isValid(): boolean {
    const clean = this.clean;
    return clean.length === 11 || clean.length === 14;
  }
}
