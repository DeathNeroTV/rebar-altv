export interface InteriorGroup {
    [key: string]: boolean;
}

export interface GlobalType {
    currentInteriorId: number;
    Online: InteriorGroup;
    Biker: InteriorGroup;
    FinanceOffices: InteriorGroup;
    HighLife: InteriorGroup;
    Security: InteriorGroup;
    ResetInteriorVariables(): void;
}