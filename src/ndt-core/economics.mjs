/** Standalone NDT economic core. No tariffs are assumed or imported. Amounts in integer kopecks. */
export const NDT_METHODS = Object.freeze(['rk','uzk','vik','pvk','mk','thick']);
const integer=(v,name,min=0)=>{if(!Number.isSafeInteger(v)||v<min)throw new RangeError(name+' must be an integer >= '+min);return v;};
const method=(v)=>{if(!NDT_METHODS.includes(v))throw new RangeError('Unsupported NDT method: '+v);return v;};
const sum=(xs)=>xs.reduce((s,x)=>{const v=s+x;if(!Number.isSafeInteger(v))throw new RangeError('Money overflow');return v;},0);
const mul=(a,b)=>{const v=a*b;if(!Number.isSafeInteger(v))throw new RangeError('Money overflow');return v;};
export function volumeQuote(lines){
 if(!Array.isArray(lines)||!lines.length)throw new RangeError('At least one method line required');
 const details=lines.map((line)=>{
  method(line.method);
  const units=['joints','meters','exposures','points'];
  if(!units.includes(line.unit))throw new RangeError('Invalid unit');
  if(line.method==='thick'&&line.unit!=='points')throw new RangeError('Ultrasonic thickness requires points');
  integer(line.quantity,'quantity',1);integer(line.rateKopecks,'rateKopecks');
  return {method:line.method,unit:line.unit,quantity:line.quantity,amountKopecks:mul(line.quantity,line.rateKopecks)};
 });
 return {lines:details,totalKopecks:sum(details.map(x=>x.amountKopecks))};
}
export function resourceCost({crew=[],equipment=[],consumables=[],travel=[],overheadKopecks=0}={}){
 const categories={};
 for(const [key,items] of Object.entries({crew,equipment,consumables,travel})){
  if(!Array.isArray(items))throw new TypeError(key+' must be an array');
  categories[key]=sum(items.map(x=>{integer(x.quantity,'quantity');integer(x.rateKopecks,'rateKopecks');return mul(x.quantity,x.rateKopecks);}));
 }
 integer(overheadKopecks,'overheadKopecks');
 categories.overhead=overheadKopecks;
 return {categories,totalKopecks:sum(Object.values(categories))};
}
export function priceForMargin(costKopecks,marginBasisPoints=2500){
 integer(costKopecks,'costKopecks');integer(marginBasisPoints,'marginBasisPoints');
 if(marginBasisPoints>=10000)throw new RangeError('Margin must be below 100%');
 const priceKopecks=Math.ceil(costKopecks*10000/(10000-marginBasisPoints));
 if(!Number.isSafeInteger(priceKopecks))throw new RangeError('Money overflow');
 return priceKopecks;
}
export function compareModels({volumeLines,resources,marginBasisPoints=2500,sharedCostsKopecks=0}){
 integer(sharedCostsKopecks,'sharedCostsKopecks');
 const volume=volumeQuote(volumeLines);
 const resource=resourceCost(resources);
 // Shared mobilization is added once to the resource cost, never once per method.
 const fullCostKopecks=sum([resource.totalKopecks,sharedCostsKopecks]);
 const targetPriceKopecks=priceForMargin(fullCostKopecks,marginBasisPoints);
 const quotedPriceKopecks=volume.totalKopecks;
 const profitKopecks=quotedPriceKopecks-fullCostKopecks;
 return {volume,resource,sharedCostsKopecks,fullCostKopecks,quotedPriceKopecks,targetPriceKopecks,profitKopecks,marginPercent:quotedPriceKopecks>0?profitKopecks/quotedPriceKopecks*100:null,belowTarget:quotedPriceKopecks<targetPriceKopecks};
}
