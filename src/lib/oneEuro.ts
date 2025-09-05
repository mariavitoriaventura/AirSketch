export class OneEuro {
  private prevV?: number; private prevDv?: number;
  constructor(private freq=30, private minCut=0.8, private beta=0.05) {}
  private alpha(cut:number){ const te=1/this.freq; const tau=1/(2*Math.PI*cut); return te/(te+tau); }
  filter(v:number){
    if(this.prevV===undefined){ this.prevV=v; this.prevDv=0; return v; }
    const dv=(v-this.prevV)*this.freq;
    const edv=this.prevDv!+this.alpha(1.0)*(dv-this.prevDv!);
    const cut=this.minCut+this.beta*Math.abs(edv);
    const ev=this.prevV+this.alpha(cut)*(v-this.prevV);
    this.prevV=ev; this.prevDv=edv; return ev;
  }
}